package middleware

import (
	"context"
	"fmt"
	"strconv"
	"time"

	rds "server/internal/redis"
	"server/internal/utils"

	"github.com/gofiber/fiber/v2"
)

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────

type LimitConfig struct {
	Max      int
	Window   time.Duration
	KeyFunc  func(*fiber.Ctx) string
	Message  string
	SkipFunc func(*fiber.Ctx) bool
}

// ─────────────────────────────────────────────────────────────────────────────
// LUA — atomic INCR + EXPIRE in one round-trip
// eliminates the INCR/EXPIRE race condition
// ─────────────────────────────────────────────────────────────────────────────

const luaIncrExpire = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then
    redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return count
`

// ─────────────────────────────────────────────────────────────────────────────
// RATE LIMITER
// ─────────────────────────────────────────────────────────────────────────────

// RateLimiter returns a fixed-window rate limiter backed by Redis.
// On Redis failure it fails open — a Redis outage never takes down the API.
func RateLimiter(r *rds.Redis, cfg LimitConfig) fiber.Handler {
	if cfg.KeyFunc == nil {
		cfg.KeyFunc = ipKey
	}
	if cfg.Message == "" {
		cfg.Message = "too many requests, please slow down"
	}

	windowSecs := int64(cfg.Window.Seconds())

	// Load Lua script once at startup — reuse SHA on every request
	client, err := r.Client()
	if err != nil {
		utils.Error("rate limiter: redis client unavailable at init", err, nil)
	}

	var scriptSHA string
	if client != nil {
		sha, err := client.ScriptLoad(context.Background(), luaIncrExpire).Result()
		if err != nil {
			utils.Error("rate limiter: lua script load failed", err, nil)
		} else {
			scriptSHA = sha
		}
	}

	return func(c *fiber.Ctx) error {
		if cfg.SkipFunc != nil && cfg.SkipFunc(c) {
			return c.Next()
		}

		cl, err := r.Client()
		if err != nil {
			utils.Error("rate limiter: redis unavailable", err, nil)
			return c.Next() // fail open
		}

		// Bucket key — scoped to identifier + current time slot
		// Automatically resets after cfg.Window with no background jobs
		slot := time.Now().Unix() / windowSecs
		key := fmt.Sprintf("rl:%s:%d", cfg.KeyFunc(c), slot)

		ctx := c.Context()

		res, err := cl.EvalSha(ctx, scriptSHA, []string{key},
			strconv.FormatInt(windowSecs, 10),
		).Int64()
		if err != nil {
			utils.Error("rate limiter: eval failed", err, map[string]any{"key": key})
			return c.Next() // fail open
		}

		count := int(res)
		remaining := max(cfg.Max-count, 0)

		ttl, _ := cl.TTL(ctx, key).Result()
		resetAt := time.Now().Add(ttl).Unix()

		c.Set("X-RateLimit-Limit", strconv.Itoa(cfg.Max))
		c.Set("X-RateLimit-Remaining", strconv.Itoa(remaining))
		c.Set("X-RateLimit-Reset", strconv.FormatInt(resetAt, 10))

		if count > cfg.Max {
			c.Set("Retry-After", strconv.Itoa(int(ttl.Seconds())))
			return utils.TooManyRequests(cfg.Message)
		}

		return c.Next()
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// KEY FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

func ipKey(c *fiber.Ctx) string {
	return "ip:" + c.IP()
}

func UserIDKey(c *fiber.Ctx) string {
	val := c.Locals("user_id")
	if val == nil {
		return "ip:" + c.IP()
	}

	switch v := val.(type) {
	case fmt.Stringer:
		if uid := v.String(); uid != "" {
			return "uid:" + uid
		}
	default:
		if uid := fmt.Sprintf("%v", v); uid != "" {
			return "uid:" + uid
		}
	}

	return "ip:" + c.IP()
}

// ─────────────────────────────────────────────────────────────────────────────
// PRESETS
// ─────────────────────────────────────────────────────────────────────────────

// Limiters holds all preset rate limiters — built once, reused across routes.
type Limiters struct {
	General fiber.Handler // 120 req/min per IP    — public endpoints
	Auth    fiber.Handler // 10  req/5min per IP   — login, register
	OTP     fiber.Handler // 3   req/10min per IP  — email verify, resend
	API     fiber.Handler // 600 req/hour per user — authenticated API
}

// NewLimiters builds all preset limiters using the injected Redis client.
func NewLimiters(r *rds.Redis) *Limiters {
	return &Limiters{
		General: RateLimiter(r, LimitConfig{
			Max:     120,
			Window:  time.Minute,
			Message: "too many requests, please wait a moment and try again",
		}),
		Auth: RateLimiter(r, LimitConfig{
			Max:     10,
			Window:  5 * time.Minute,
			Message: "too many attempts, please wait 5 minutes and try again",
		}),
		OTP: RateLimiter(r, LimitConfig{
			Max:     5,
			Window:  10 * time.Minute,
			Message: "otp request limit reached, please wait 10 minutes",
		}),
		API: RateLimiter(r, LimitConfig{
			Max:     600,
			Window:  time.Hour,
			KeyFunc: UserIDKey,
			Message: "api rate limit exceeded, resets in one hour",
		}),
	}
}

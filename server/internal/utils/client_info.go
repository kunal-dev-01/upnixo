package utils

import (
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"strings"
	"time"

	"github.com/mssola/user_agent"
)

const (
	geoIPURL     = "http://ip-api.com/json/%s?fields=status,message,city,country"
	geoIPTimeout = 2 * time.Second
)

// ClientInfo holds parsed client metadata from User-Agent and IP.
type ClientInfo struct {
	OS         string `json:"os"`
	Browser    string `json:"browser"`
	DeviceName string `json:"device_name"`
	City       string `json:"city"`
	Country    string `json:"country"`
}

// IsLocalNetwork reports whether the client is from a private/local address.
func (c ClientInfo) IsLocalNetwork() bool {
	return c.City == "Local Network"
}

// ipClient is reused across calls with a short timeout to prevent 
// hanging the FaaS execution during GeoIP lookups.
var ipClient = &http.Client{
	Timeout: geoIPTimeout,
}

// ParseClientInfo extracts OS, browser, device from User-Agent and 
// city/country from IP via a fast GeoIP lookup.
//
// Note: Uses ip-api.com free tier (rate limit: 45 req/minute, non-commercial).
// For high-traffic production FaaS, use a paid service like MaxMind or IPInfo.
func ParseClientInfo(ip, userAgent string) ClientInfo {
	info := ClientInfo{
		OS:         "Unknown",
		Browser:    "Unknown",
		DeviceName: "Unknown",
		City:       "Unknown",
		Country:    "Unknown",
	}

	info.parseUserAgent(userAgent)
	info.parseLocation(ip)

	return info
}

// ─── Internal Parsers ───────────────────────────────────────────────────────

func (c *ClientInfo) parseUserAgent(uaString string) {
	if uaString == "" {
		return
	}

	ua := user_agent.New(uaString)

	c.OS = ua.OS()

	if name, version := ua.Browser(); name != "" {
		if version != "" {
			c.Browser = name + " " + version
		} else {
			c.Browser = name
		}
	}

	switch {
	case ua.Mobile():
		c.DeviceName = "Mobile"
	case ua.Bot():
		c.DeviceName = "Bot"
	default:
		c.DeviceName = "Desktop"
	}
}

func (c *ClientInfo) parseLocation(ip string) {
	ip = strings.TrimSpace(ip)
	if ip == "" {
		return
	}

	// Handle "IP:port" format (common in r.RemoteAddr)
	if host, _, err := net.SplitHostPort(ip); err == nil {
		ip = host
	}

	parsed := net.ParseIP(ip)
	if parsed == nil {
		return
	}

	// Skip GeoIP for private/local addresses (loopback, private, link-local)
	if parsed.IsLoopback() || parsed.IsPrivate() || parsed.IsLinkLocalUnicast() {
		c.City = "Local Network"
		c.Country = "Local Network"
		return
	}

	// Fast GeoIP lookup — fail-safe, never blocks on errors
	if loc := fetchGeoIP(ip); loc != nil {
		if loc.City != "" {
			c.City = loc.City
		}
		if loc.Country != "" {
			c.Country = loc.Country
		}
	}
}

// ─── GeoIP Lookup ───────────────────────────────────────────────────────────

type geoIPResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
	City    string `json:"city"`
	Country string `json:"country"`
}

// fetchGeoIP performs a non-blocking lookup. Returns nil on any error.
func fetchGeoIP(ip string) *geoIPResponse {
	req, err := http.NewRequest(http.MethodGet, fmt.Sprintf(geoIPURL, ip), nil)
	if err != nil {
		return nil
	}

	resp, err := ipClient.Do(req)
	if err != nil {
		return nil
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil
	}

	var data geoIPResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil
	}

	return &data
}
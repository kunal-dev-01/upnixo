package service

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"server/internal/config"
	"server/internal/dto"
	"server/internal/models"
	"server/internal/repo"
	"server/internal/security"
	"server/internal/utils"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"
	"golang.org/x/oauth2/google"
)

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────────────────────────────────────

type OAuthService struct {
	cfg         *config.Config
	authRepo    repo.AuthRepository
	tokenRepo   *repo.TokenRepository
	sessionRepo *repo.SessionRepository
	jwt         *security.JWTManager
	googleCfg   *oauth2.Config
	githubCfg   *oauth2.Config
}

func NewOAuthService(
	cfg *config.Config,
	authRepo repo.AuthRepository,
	tokenRepo *repo.TokenRepository,
	sessionRepo *repo.SessionRepository,
	jwt *security.JWTManager,
) *OAuthService {
	googleCfg := &oauth2.Config{
		ClientID:     cfg.Google.ClientID,
		ClientSecret: cfg.Google.ClientSecret,
		RedirectURL:  cfg.Google.RedirectURL,
		Scopes:       []string{"openid", "email", "profile"},
		Endpoint:     google.Endpoint,
	}

	githubCfg := &oauth2.Config{
		ClientID:     cfg.Github.ClientID,
		ClientSecret: cfg.Github.ClientSecret,
		RedirectURL:  cfg.Github.RedirectURL,
		Scopes:       []string{"user:email", "read:user"},
		Endpoint:     github.Endpoint,
	}

	return &OAuthService{
		cfg:         cfg,
		authRepo:    authRepo,
		tokenRepo:   tokenRepo,
		sessionRepo: sessionRepo,
		jwt:         jwt,
		googleCfg:   googleCfg,
		githubCfg:   githubCfg,
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// REDIRECT — generate OAuth URL with CSRF state
// ─────────────────────────────────────────────────────────────────────────────

// GetRedirectURL generates a provider OAuth URL.
// State token is stored in Redis for CSRF validation.
func (s *OAuthService) GetRedirectURL(ctx context.Context, provider models.OAuthProvider) (string, error) {
	state, err := security.GenerateToken(16)
	if err != nil {
		return "", err
	}

	// Store state in Redis — TTL 10 min
	if err = s.tokenRepo.StoreOAuthState(ctx, state, string(provider), 10*time.Minute); err != nil {
		return "", err
	}

	cfg := s.providerConfig(provider)
	return cfg.AuthCodeURL(state, oauth2.AccessTypeOffline), nil
}

// ─────────────────────────────────────────────────────────────────────────────
// CALLBACK — exchange code, find/create user, issue session or 2FA pending
// ─────────────────────────────────────────────────────────────────────────────

type OAuthCallbackResult struct {
	// Set when auth is complete (no 2FA or 2FA not enabled)
	AuthResult *dto.AuthResult

	// Set when user has 2FA enabled — frontend must submit TOTP
	TwoFAPending      bool
	TwoFAPendingToken string
}

func (s *OAuthService) HandleCallback(
	ctx context.Context,
	provider models.OAuthProvider,
	code, state string,
	clientInfo dto.ClientInfo,
) (*OAuthCallbackResult, error) {
	// 1. Validate CSRF state
	if err := s.tokenRepo.ConsumeOAuthState(ctx, state, string(provider)); err != nil {
		return nil, utils.BadRequest("invalid or expired oauth state")
	}

	// 2. Exchange code for access token
	oauthCfg := s.providerConfig(provider)
	token, err := oauthCfg.Exchange(ctx, code)
	if err != nil {
		utils.Error("oauth code exchange failed", err, map[string]any{"provider": provider})
		return nil, utils.Internal(err)
	}

	// 3. Fetch user profile from provider
	profile, err := s.fetchProfile(ctx, provider, token)
	if err != nil {
		return nil, err
	}

	// 4. Find or create user + link OAuth account
	user, _, err := s.authRepo.FindOrCreateOAuthUser(ctx, repo.OAuthLoginParams{
		Provider:          provider,
		ProviderUserID:    profile.ID,
		ProviderEmail:     profile.Email,
		ProviderName:      &profile.Name,
		ProviderAvatarURL: &profile.AvatarURL,
		Scopes:            oauthCfg.Scopes,
		ProviderMeta:      profile.Raw,
	})
	if err != nil {
		return nil, err
	}

	// 5. Block check
	if user.IsBlocked {
		return nil, utils.Forbidden("your account has been suspended")
	}

	if !user.IsActive {
		return nil, utils.Forbidden("your account is inactive")
	}

	// 6. 2FA check — issue pending token instead of full session
	if user.TwoFactorEnabled {
		pendingToken, err := security.GenerateTwoFAPendingToken()
		if err != nil {
			return nil, err
		}

		if err = s.tokenRepo.StoreTwoFAPendingToken(ctx, user.ID.String(), pendingToken, 5*time.Minute); err != nil {
			return nil, err
		}

		return &OAuthCallbackResult{
			TwoFAPending:      true,
			TwoFAPendingToken: pendingToken,
		}, nil
	}

	// 7. No 2FA — create full session
	result, err := s.createSession(ctx, user, clientInfo)
	if err != nil {
		return nil, err
	}

	// 8. Record login in background
	go s.authRepo.RecordLogin(ctx, user.ID, clientInfo.IP)

	return &OAuthCallbackResult{AuthResult: result}, nil
}

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER PROFILES
// ─────────────────────────────────────────────────────────────────────────────

type oauthProfile struct {
	ID        string
	Email     string
	Name      string
	AvatarURL string
	Raw       []byte
}

func (s *OAuthService) fetchProfile(ctx context.Context, provider models.OAuthProvider, token *oauth2.Token) (*oauthProfile, error) {
	switch provider {
	case models.OAuthProviderGoogle:
		return s.fetchGoogleProfile(ctx, token)
	case models.OAuthProviderGitHub:
		return s.fetchGitHubProfile(ctx, token)
	default:
		return nil, utils.BadRequest("unsupported oauth provider")
	}
}

func (s *OAuthService) fetchGoogleProfile(ctx context.Context, token *oauth2.Token) (*oauthProfile, error) {
	client := s.googleCfg.Client(ctx, token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v3/userinfo")
	if err != nil {
		return nil, utils.Internal(err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	var data struct {
		Sub     string `json:"sub"`
		Email   string `json:"email"`
		Name    string `json:"name"`
		Picture string `json:"picture"`
	}
	if err = json.Unmarshal(body, &data); err != nil {
		return nil, utils.Internal(err)
	}

	if data.Email == "" {
		return nil, utils.BadRequest("google account has no email")
	}

	return &oauthProfile{
		ID:        data.Sub,
		Email:     data.Email,
		Name:      data.Name,
		AvatarURL: data.Picture,
		Raw:       body,
	}, nil
}

func (s *OAuthService) fetchGitHubProfile(ctx context.Context, token *oauth2.Token) (*oauthProfile, error) {
	client := s.githubCfg.Client(ctx, token)

	// Fetch user
	resp, err := client.Get("https://api.github.com/user")
	if err != nil {
		return nil, utils.Internal(err)
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)

	var data struct {
		ID        int    `json:"id"`
		Login     string `json:"login"`
		Name      string `json:"name"`
		Email     string `json:"email"`
		AvatarURL string `json:"avatar_url"`
	}
	if err = json.Unmarshal(body, &data); err != nil {
		return nil, utils.Internal(err)
	}

	// GitHub may not return email in user endpoint — fetch primary email separately
	email := data.Email
	if email == "" {
		email, err = s.fetchGitHubPrimaryEmail(client)
		if err != nil {
			return nil, err
		}
	}

	name := data.Name
	if name == "" {
		name = data.Login
	}

	return &oauthProfile{
		ID:        fmt.Sprintf("%d", data.ID),
		Email:     email,
		Name:      name,
		AvatarURL: data.AvatarURL,
		Raw:       body,
	}, nil
}

func (s *OAuthService) fetchGitHubPrimaryEmail(client *http.Client) (string, error) {
	resp, err := client.Get("https://api.github.com/user/emails")
	if err != nil {
		return "", utils.Internal(err)
	}
	defer resp.Body.Close()

	var emails []struct {
		Email    string `json:"email"`
		Primary  bool   `json:"primary"`
		Verified bool   `json:"verified"`
	}
	if err = json.NewDecoder(resp.Body).Decode(&emails); err != nil {
		return "", utils.Internal(err)
	}

	for _, e := range emails {
		if e.Primary && e.Verified {
			return e.Email, nil
		}
	}

	return "", utils.BadRequest("no verified primary email found on github account")
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL
// ─────────────────────────────────────────────────────────────────────────────

func (s *OAuthService) createSession(ctx context.Context, user *models.User, info dto.ClientInfo) (*dto.AuthResult, error) {
	sessionID, err := security.GenerateSessionID()
	if err != nil {
		return nil, err
	}

	pair, err := s.jwt.GenerateTokenPair(user, sessionID)
	if err != nil {
		return nil, err
	}

	ttl := s.cfg.JWT.RefreshTokenDuration

	meta := &dto.SessionMetadata{
		ID:           sessionID,
		UserID:       user.ID.String(),
		RefreshToken: pair.RefreshToken,
		IPAddress:    info.IP,
		Browser:      info.Browser,
		OS:           info.OS,
		DeviceName:   info.DeviceName,
		City:         info.City,
		Country:      info.Country,
		CreatedAt:    time.Now(),
		ExpiresAt:    time.Now().Add(ttl),
	}

	if err = s.sessionRepo.StoreSession(ctx, meta, ttl); err != nil {
		return nil, err
	}

	safe := user.ToSafe()
	return &dto.AuthResult{
		AccessToken: pair.AccessToken,
		SessionID:   sessionID,
		User:        &safe,
	}, nil
}

func (s *OAuthService) providerConfig(provider models.OAuthProvider) *oauth2.Config {
	if provider == models.OAuthProviderGitHub {
		return s.githubCfg
	}
	return s.googleCfg
}

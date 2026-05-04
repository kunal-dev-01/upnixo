package dto

import "time"

// SessionMetadata is stored in Redis against session:<session_id>
type SessionMetadata struct {
	ID           string `json:"id"` // session ID = JWT JTI
	UserID       string `json:"user_id"`
	RefreshToken string `json:"refresh_token"` // stored for rotation validation

	// Device info
	IPAddress  string `json:"ip_address"`
	Browser    string `json:"browser"`
	OS         string `json:"os"`
	DeviceName string `json:"device_name"`

	// Location
	City    string `json:"city"`
	Country string `json:"country"`

	CreatedAt time.Time `json:"created_at"`
	ExpiresAt time.Time `json:"expires_at"`
}

// SafeSession is sent to the client — refresh token omitted.
type SafeSession struct {
	ID         string    `json:"id"`
	IPAddress  string    `json:"ip_address"`
	Browser    string    `json:"browser"`
	OS         string    `json:"os"`
	DeviceName string    `json:"device_name"`
	City       string    `json:"city"`
	Country    string    `json:"country"`
	CreatedAt  time.Time `json:"created_at"`
	ExpiresAt  time.Time `json:"expires_at"`
	IsCurrent  bool      `json:"is_current"`
}

func (s *SessionMetadata) ToSafe(currentSessionID string) SafeSession {
	return SafeSession{
		ID:         s.ID,
		IPAddress:  s.IPAddress,
		Browser:    s.Browser,
		OS:         s.OS,
		DeviceName: s.DeviceName,
		City:       s.City,
		Country:    s.Country,
		CreatedAt:  s.CreatedAt,
		ExpiresAt:  s.ExpiresAt,
		IsCurrent:  s.ID == currentSessionID,
	}
}

package dto

// UpdateUserRequest is used for partial profile updates
type UpdateUserRequest struct {
	FullName  *string `json:"full_name"  validate:"omitempty,valid_name"`
	Timezone  *string `json:"timezone"   validate:"omitempty"`
	Locale    *string `json:"locale"     validate:"omitempty"`
}

// UpdatePreferencesRequest is used for partial preference updates
type UpdatePreferencesRequest struct {
	Theme            *string               `json:"theme"             validate:"omitempty,oneof=light dark system"`
	SidebarCollapsed *bool                 `json:"sidebar_collapsed" validate:"omitempty"`
	CompactView      *bool                 `json:"compact_view"      validate:"omitempty"`
	Notifications    *NotificationSettings `json:"notifications"     validate:"omitempty"`
	DefaultCurrency  *string               `json:"default_currency"  validate:"omitempty"`
	Language         *string               `json:"language"          validate:"omitempty"`
}

// ListUsersQuery is used for admin user listing filter and pagination requests
type ListUsersQuery struct {
	Search        string `query:"search"`
	Status        string `query:"status"`
	IsActive      *bool  `query:"is_active"`
	IsBlocked     *bool  `query:"is_blocked"`
	EmailVerified *bool  `query:"email_verified"`
	Page          int    `query:"page"`
	Limit         int    `query:"limit"`
}

// BlockUserRequest is used by admins to specify why a user is being blocked
type BlockUserRequest struct {
	Reason *string `json:"reason"`
}


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

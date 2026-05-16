package utils

import (
	"fmt"
	"regexp"
	"strings"
	"time"
)

var slugifyRegex = regexp.MustCompile(`[^a-z0-9]+`)

// GenerateSlug creates a URL-friendly slug from a title string.
// It appends a short random-like suffix (time-based) to ensure uniqueness.
func GenerateSlug(title string) string {
	slug := strings.ToLower(title)
	slug = slugifyRegex.ReplaceAllString(slug, "-")
	slug = strings.Trim(slug, "-")

	if len(slug) > 80 {
		slug = slug[:80]
	}

	return fmt.Sprintf("%s-%d", slug, time.Now().Unix()%10000)
}

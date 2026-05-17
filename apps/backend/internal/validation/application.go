package validation

import (
	"fmt"
	"net/mail"

	"github.com/KrishnaTejaCheruku/jobops-tracker/apps/backend/internal/models"
)

var allowedStatuses = map[string]bool{
	"Saved":               true,
	"Applied":             true,
	"Recruiter Contacted": true,
	"Interview Scheduled": true,
	"Technical Interview": true,
	"Offer":               true,
	"Rejected":            true,
	"Ghosted":             true,
	"Withdrawn":           true,
}

var allowedPriorities = map[string]bool{
	"Low":    true,
	"Medium": true,
	"High":   true,
}

var allowedSources = map[string]bool{
	"LinkedIn":        true,
	"Company Website": true,
	"Recruiter":       true,
	"Referral":        true,
	"Other":           true,
}

var allowedWorkModes = map[string]bool{
	"Remote":  true,
	"Hybrid":  true,
	"On-site": true,
	"":        true,
}

func ValidateCreateApplication(req models.CreateApplicationRequest) error {
	return validateApplicationFields(
		req.Status,
		req.Priority,
		req.Source,
		req.WorkMode,
		req.RecruiterEmail,
	)
}

func ValidateUpdateApplication(req models.UpdateApplicationRequest) error {
	return validateApplicationFields(
		req.Status,
		req.Priority,
		req.Source,
		req.WorkMode,
		req.RecruiterEmail,
	)
}

func validateApplicationFields(status, priority, source, workMode, recruiterEmail string) error {
	if status != "" && !allowedStatuses[status] {
		return fmt.Errorf("invalid status: %s", status)
	}

	if priority != "" && !allowedPriorities[priority] {
		return fmt.Errorf("invalid priority: %s", priority)
	}

	if source != "" && !allowedSources[source] {
		return fmt.Errorf("invalid source: %s", source)
	}

	if !allowedWorkModes[workMode] {
		return fmt.Errorf("invalid work mode: %s", workMode)
	}

	if recruiterEmail != "" {
		if _, err := mail.ParseAddress(recruiterEmail); err != nil {
			return fmt.Errorf("invalid recruiter email: %s", recruiterEmail)
		}
	}

	return nil
}

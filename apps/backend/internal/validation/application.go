package validation

import (
	"fmt"
	"net/mail"
	"net/url"
	"strings"
	"time"

	"github.com/KrishnaTejaCheruku/jobops-tracker/apps/backend/internal/models"
)

type FieldError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

type ValidationError struct {
	Fields []FieldError `json:"fields"`
}

func (e ValidationError) Error() string {
	return "validation failed"
}

func (e ValidationError) IsEmpty() bool {
	return len(e.Fields) == 0
}

func AsValidationError(err error) (ValidationError, bool) {
	validationErr, ok := err.(ValidationError)
	return validationErr, ok
}

func ValidateCreateApplication(req models.CreateApplicationRequest) error {
	validator := newApplicationValidator()

	validator.required("job_title", req.JobTitle, "job_title is required")
	validator.required("company_name", req.CompanyName, "company_name is required")

	validateApplicationCommonFields(
		validator,
		req.Source,
		req.JobURL,
		req.WorkMode,
		req.Status,
		req.CVVersionID,
		req.FollowUpDate,
		req.RecruiterEmail,
		req.Priority,
		req.AppliedDate,
	)

	return validator.err()
}

func ValidateUpdateApplication(req models.UpdateApplicationRequest) error {
	validator := newApplicationValidator()

	validator.required("job_title", req.JobTitle, "job_title is required")
	validator.required("company_name", req.CompanyName, "company_name is required")

	validateApplicationCommonFields(
		validator,
		req.Source,
		req.JobURL,
		req.WorkMode,
		req.Status,
		req.CVVersionID,
		req.FollowUpDate,
		req.RecruiterEmail,
		req.Priority,
		req.AppliedDate,
	)

	return validator.err()
}

func ValidateApplicationFilters(filters models.ApplicationFilters) error {
	validator := newApplicationValidator()

	validator.maxLength("search", filters.Search, 200, "search must be 200 characters or less")
	validator.allowedIfPresent("status", filters.Status, allowedStatuses(), "invalid status filter")
	validator.allowedIfPresent("priority", filters.Priority, allowedPriorities(), "invalid priority filter")
	validator.allowedIfPresent("source", filters.Source, allowedSources(), "invalid source filter")
	validator.allowedIfPresent("work_mode", filters.WorkMode, allowedWorkModes(), "invalid work_mode filter")

	return validator.err()
}

type applicationValidator struct {
	fields []FieldError
}

func newApplicationValidator() *applicationValidator {
	return &applicationValidator{
		fields: []FieldError{},
	}
}

func (v *applicationValidator) err() error {
	if len(v.fields) == 0 {
		return nil
	}

	return ValidationError{Fields: v.fields}
}

func (v *applicationValidator) add(field string, message string) {
	v.fields = append(v.fields, FieldError{
		Field:   field,
		Message: message,
	})
}

func (v *applicationValidator) required(field string, value string, message string) {
	if strings.TrimSpace(value) == "" {
		v.add(field, message)
	}
}

func (v *applicationValidator) maxLength(field string, value string, max int, message string) {
	if len(strings.TrimSpace(value)) > max {
		v.add(field, message)
	}
}

func (v *applicationValidator) allowedIfPresent(field string, value string, allowed map[string]bool, message string) {
	value = strings.TrimSpace(value)
	if value == "" {
		return
	}

	if !allowed[value] {
		v.add(field, message)
	}
}

func validateApplicationCommonFields(
	validator *applicationValidator,
	source string,
	jobURL string,
	workMode string,
	status string,
	cvVersionID int64,
	followUpDate string,
	recruiterEmail string,
	priority string,
	appliedDate string,
) {
	validator.allowedIfPresent("source", source, allowedSources(), "source must be one of: LinkedIn, Company Website, Recruiter, Referral, Other")
	validator.allowedIfPresent("work_mode", workMode, allowedWorkModes(), "work_mode must be one of: Remote, Hybrid, On-site")
	validator.allowedIfPresent("status", status, allowedStatuses(), "status is not supported")
	validator.allowedIfPresent("priority", priority, allowedPriorities(), "priority must be one of: Low, Medium, High")

	if cvVersionID < 0 {
		validator.add("cv_version_id", "cv_version_id cannot be negative")
	}

	validateURL(validator, "job_url", jobURL)
	validateEmail(validator, "recruiter_email", recruiterEmail)
	validateDate(validator, "follow_up_date", followUpDate)
	validateDate(validator, "applied_date", appliedDate)
}

func validateURL(validator *applicationValidator, field string, value string) {
	value = strings.TrimSpace(value)
	if value == "" {
		return
	}

	parsedURL, err := url.ParseRequestURI(value)
	if err != nil || parsedURL.Scheme == "" || parsedURL.Host == "" {
		validator.add(field, fmt.Sprintf("%s must be a valid URL", field))
		return
	}

	if parsedURL.Scheme != "http" && parsedURL.Scheme != "https" {
		validator.add(field, fmt.Sprintf("%s must start with http:// or https://", field))
	}
}

func validateEmail(validator *applicationValidator, field string, value string) {
	value = strings.TrimSpace(value)
	if value == "" {
		return
	}

	if _, err := mail.ParseAddress(value); err != nil {
		validator.add(field, fmt.Sprintf("%s must be a valid email address", field))
	}
}

func validateDate(validator *applicationValidator, field string, value string) {
	value = strings.TrimSpace(value)
	if value == "" {
		return
	}

	if _, err := time.Parse("2006-01-02", value); err != nil {
		validator.add(field, fmt.Sprintf("%s must use YYYY-MM-DD format", field))
	}
}

func allowedSources() map[string]bool {
	return map[string]bool{
		"LinkedIn":        true,
		"Company Website": true,
		"Recruiter":       true,
		"Referral":        true,
		"Other":           true,
	}
}

func allowedWorkModes() map[string]bool {
	return map[string]bool{
		"Remote":  true,
		"Hybrid":  true,
		"On-site": true,
	}
}

func allowedPriorities() map[string]bool {
	return map[string]bool{
		"Low":    true,
		"Medium": true,
		"High":   true,
	}
}

func allowedStatuses() map[string]bool {
	return map[string]bool{
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
}

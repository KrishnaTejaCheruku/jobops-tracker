package validation

import (
	"testing"
	"time"

	"github.com/KrishnaTejaCheruku/jobops-tracker/apps/backend/internal/models"
)

func TestValidateCreateApplicationAllowsValidRequest(t *testing.T) {
	req := models.CreateApplicationRequest{
		JobTitle:       "DevOps Engineer",
		CompanyName:    "Example GmbH",
		Status:         "Applied",
		Priority:       "High",
		Source:         "LinkedIn",
		WorkMode:       "Hybrid",
		RecruiterEmail: "recruiter@example.com",
	}

	if err := ValidateCreateApplication(req); err != nil {
		t.Fatalf("expected valid request, got error: %v", err)
	}
}

func TestValidateCreateApplicationRejectsInvalidStatus(t *testing.T) {
	req := models.CreateApplicationRequest{
		Status:   "Random Status",
		Priority: "High",
		Source:   "LinkedIn",
		WorkMode: "Hybrid",
	}

	if err := ValidateCreateApplication(req); err == nil {
		t.Fatal("expected invalid status error, got nil")
	}
}

func TestValidateCreateApplicationRejectsInvalidPriority(t *testing.T) {
	req := models.CreateApplicationRequest{
		Status:   "Applied",
		Priority: "Urgent",
		Source:   "LinkedIn",
		WorkMode: "Hybrid",
	}

	if err := ValidateCreateApplication(req); err == nil {
		t.Fatal("expected invalid priority error, got nil")
	}
}

func TestValidateCreateApplicationRejectsInvalidSource(t *testing.T) {
	req := models.CreateApplicationRequest{
		Status:   "Applied",
		Priority: "High",
		Source:   "Unknown Source",
		WorkMode: "Hybrid",
	}

	if err := ValidateCreateApplication(req); err == nil {
		t.Fatal("expected invalid source error, got nil")
	}
}

func TestValidateCreateApplicationRejectsInvalidWorkMode(t *testing.T) {
	req := models.CreateApplicationRequest{
		Status:   "Applied",
		Priority: "High",
		Source:   "LinkedIn",
		WorkMode: "Everywhere",
	}

	if err := ValidateCreateApplication(req); err == nil {
		t.Fatal("expected invalid work mode error, got nil")
	}
}

func TestValidateCreateApplicationRejectsInvalidRecruiterEmail(t *testing.T) {
	req := models.CreateApplicationRequest{
		Status:         "Applied",
		Priority:       "High",
		Source:         "LinkedIn",
		WorkMode:       "Hybrid",
		RecruiterEmail: "not-an-email",
	}

	if err := ValidateCreateApplication(req); err == nil {
		t.Fatal("expected invalid recruiter email error, got nil")
	}
}

func TestValidateCreateApplicationRejectsFutureAppliedDate(t *testing.T) {
	req := models.CreateApplicationRequest{
		JobTitle:    "DevOps Engineer",
		CompanyName: "Example GmbH",
		Status:      "Applied",
		Priority:    "High",
		Source:      "LinkedIn",
		WorkMode:    "Hybrid",
		AppliedDate: time.Now().AddDate(0, 0, 1).Format("2006-01-02"),
	}

	err := ValidateCreateApplication(req)
	if err == nil {
		t.Fatal("expected future applied_date error, got nil")
	}

	validationErr, ok := AsValidationError(err)
	if !ok {
		t.Fatalf("expected ValidationError, got %T", err)
	}

	for _, field := range validationErr.Fields {
		if field.Field == "applied_date" && field.Message == "applied_date cannot be in the future" {
			return
		}
	}

	t.Fatalf("expected applied_date future error, got %#v", validationErr.Fields)
}

func TestValidateCreateApplicationAllowsTodayAppliedDate(t *testing.T) {
	req := models.CreateApplicationRequest{
		JobTitle:    "DevOps Engineer",
		CompanyName: "Example GmbH",
		Status:      "Applied",
		Priority:    "High",
		Source:      "LinkedIn",
		WorkMode:    "Hybrid",
		AppliedDate: time.Now().Format("2006-01-02"),
	}

	if err := ValidateCreateApplication(req); err != nil {
		t.Fatalf("expected today applied_date to be valid, got error: %v", err)
	}
}

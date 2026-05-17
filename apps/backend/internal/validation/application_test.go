package validation

import (
	"testing"

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

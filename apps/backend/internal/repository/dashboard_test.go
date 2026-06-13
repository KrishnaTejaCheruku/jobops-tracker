package repository

import (
	"testing"

	"github.com/KrishnaTejaCheruku/jobops-tracker/apps/backend/internal/models"
)

func TestDashboardPipelineBreakdownUsesMutuallyExclusiveGroups(t *testing.T) {
	statusCounts := map[string]int64{
		"Saved":               5,
		"Applied":             12,
		"In Progress":         4,
		"Interview":           3,
		"Follow-up":           3,
		"Offer":               1,
		"Rejected":            3,
		"Withdrawn":           1,
		"Recruiter Contacted": 2,
		"Technical Interview": 1,
	}

	breakdown := calculatePipelineBreakdown(statusCounts)
	expected := models.DashboardPipelineBreakdown{
		ActivePipeline: 24,
		Interviews:     3,
		Offers:         1,
		Closed:         7,
	}

	if breakdown != expected {
		t.Fatalf("expected breakdown %+v, got %+v", expected, breakdown)
	}

	if total := activeApplicationsTotal(statusCounts); total != 28 {
		t.Fatalf("expected active application total 28, got %d", total)
	}
}

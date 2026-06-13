package repository

import (
	"context"
	"math"

	"github.com/KrishnaTejaCheruku/jobops-tracker/apps/backend/internal/models"
	"github.com/jackc/pgx/v5/pgxpool"
)

type DashboardRepository struct {
	DB *pgxpool.Pool
}

func NewDashboardRepository(db *pgxpool.Pool) *DashboardRepository {
	return &DashboardRepository{DB: db}
}

var activeDashboardStatuses = map[string]bool{
	"Saved":       true,
	"Applied":     true,
	"In Progress": true,
	"Interview":   true,
	"Follow-up":   true,
	"Offer":       true,
}

var activePipelineStatuses = map[string]bool{
	"Saved":       true,
	"Applied":     true,
	"In Progress": true,
	"Follow-up":   true,
}

func (r *DashboardRepository) GetAnalytics(ctx context.Context, userID int64) (*models.DashboardAnalytics, error) {
	var analytics models.DashboardAnalytics

	err := r.DB.QueryRow(ctx, `
		SELECT
			COUNT(*) AS total_applications,
			COUNT(*) FILTER (
				WHERE status IN ('Saved', 'Applied', 'In Progress', 'Interview', 'Follow-up', 'Offer')
			) AS active_applications,
			COUNT(*) FILTER (
				WHERE status NOT IN ('Saved', 'Applied', 'In Progress', 'Interview', 'Follow-up', 'Offer')
			) AS closed_applications,
			COUNT(*) FILTER (WHERE status = 'Saved') AS saved,
			COUNT(*) FILTER (WHERE status = 'Applied') AS applied,
			COUNT(*) FILTER (WHERE status = 'In Progress') AS in_progress,
			COUNT(*) FILTER (WHERE status = 'Interview') AS interview,
			COUNT(*) FILTER (WHERE status = 'Follow-up') AS follow_up,
			COUNT(*) FILTER (WHERE status = 'Recruiter Contacted') AS recruiter_contacted,
			COUNT(*) FILTER (WHERE status = 'Interview Scheduled') AS interview_scheduled,
			COUNT(*) FILTER (WHERE status = 'Technical Interview') AS technical_interview,
			COUNT(*) FILTER (WHERE status = 'Interview') AS interviews_total,
			COUNT(*) FILTER (WHERE status = 'Offer') AS offers,
			COUNT(*) FILTER (WHERE status = 'Rejected') AS rejected,
			COUNT(*) FILTER (WHERE status = 'Ghosted') AS ghosted,
			COUNT(*) FILTER (WHERE status = 'Withdrawn') AS withdrawn,
			COUNT(*) FILTER (WHERE priority = 'High') AS high_priority,
			COUNT(*) FILTER (
				WHERE follow_up_date IS NOT NULL
				AND status IN ('Saved', 'Applied', 'In Progress', 'Interview', 'Follow-up', 'Offer')
				AND follow_up_date < CURRENT_DATE
			) AS overdue_follow_ups,
			COUNT(*) FILTER (
				WHERE follow_up_date IS NOT NULL
				AND status IN ('Saved', 'Applied', 'In Progress', 'Interview', 'Follow-up', 'Offer')
				AND follow_up_date = CURRENT_DATE
			) AS due_today_follow_ups,
			COUNT(*) FILTER (
				WHERE follow_up_date IS NOT NULL
				AND status IN ('Saved', 'Applied', 'In Progress', 'Interview', 'Follow-up', 'Offer')
				AND follow_up_date > CURRENT_DATE
			) AS upcoming_follow_ups
		FROM applications
		WHERE user_id = $1
	`, userID).Scan(
		&analytics.TotalApplications,
		&analytics.ActiveApplications,
		&analytics.ClosedApplications,
		&analytics.Saved,
		&analytics.Applied,
		&analytics.InProgress,
		&analytics.Interview,
		&analytics.FollowUp,
		&analytics.RecruiterContacted,
		&analytics.InterviewScheduled,
		&analytics.TechnicalInterview,
		&analytics.InterviewsTotal,
		&analytics.Offers,
		&analytics.Rejected,
		&analytics.Ghosted,
		&analytics.Withdrawn,
		&analytics.HighPriority,
		&analytics.OverdueFollowUps,
		&analytics.DueTodayFollowUps,
		&analytics.UpcomingFollowUps,
	)
	if err != nil {
		return nil, err
	}

	analytics.InterviewRatePercent = percentage(analytics.InterviewsTotal, analytics.TotalApplications)
	analytics.OfferRatePercent = percentage(analytics.Offers, analytics.TotalApplications)
	analytics.RejectionRatePercent = percentage(analytics.Rejected, analytics.TotalApplications)

	if analytics.ByStatus, err = r.listGroupCounts(ctx, userID, `
		SELECT
			COALESCE(NULLIF(status, ''), 'Unknown') AS name,
			COUNT(*) AS count
		FROM applications
		WHERE user_id = $1
		GROUP BY 1
		ORDER BY 2 DESC, 1 ASC
	`); err != nil {
		return nil, err
	}

	analytics.StatusCounts = statusCountsMap(analytics.ByStatus)
	analytics.PipelineBreakdown = calculatePipelineBreakdown(analytics.StatusCounts)
	analytics.ActiveApplications = activeApplicationsTotal(analytics.StatusCounts)
	analytics.ClosedApplications = analytics.PipelineBreakdown.Closed

	if analytics.BySource, err = r.listGroupCounts(ctx, userID, `
		SELECT
			COALESCE(NULLIF(source, ''), 'Unknown') AS name,
			COUNT(*) AS count
		FROM applications
		WHERE user_id = $1
		GROUP BY 1
		ORDER BY 2 DESC, 1 ASC
	`); err != nil {
		return nil, err
	}

	if analytics.ByPriority, err = r.listGroupCounts(ctx, userID, `
		SELECT
			COALESCE(NULLIF(priority, ''), 'Unknown') AS name,
			COUNT(*) AS count
		FROM applications
		WHERE user_id = $1
		GROUP BY 1
		ORDER BY 2 DESC, 1 ASC
	`); err != nil {
		return nil, err
	}

	if analytics.ByWorkMode, err = r.listGroupCounts(ctx, userID, `
		SELECT
			COALESCE(NULLIF(work_mode, ''), 'Unknown') AS name,
			COUNT(*) AS count
		FROM applications
		WHERE user_id = $1
		GROUP BY 1
		ORDER BY 2 DESC, 1 ASC
	`); err != nil {
		return nil, err
	}

	if analytics.ByCVVersion, err = r.listGroupCounts(ctx, userID, `
		SELECT
			COALESCE(NULLIF(cv_version, ''), 'Not selected') AS name,
			COUNT(*) AS count
		FROM applications
		WHERE user_id = $1
		GROUP BY 1
		ORDER BY 2 DESC, 1 ASC
	`); err != nil {
		return nil, err
	}

	if analytics.ApplicationsOverTime, err = r.listGroupCounts(ctx, userID, `
		SELECT
			applied_date::text AS name,
			COUNT(*) AS count
		FROM applications
		WHERE user_id = $1
			AND applied_date IS NOT NULL
			AND applied_date >= CURRENT_DATE - INTERVAL '30 days'
		GROUP BY applied_date
		ORDER BY applied_date ASC
	`); err != nil {
		return nil, err
	}

	return &analytics, nil
}

func statusCountsMap(items []models.DashboardGroupCount) map[string]int64 {
	results := make(map[string]int64, len(items))

	for _, item := range items {
		results[item.Name] = item.Count
	}

	return results
}

func activeApplicationsTotal(statusCounts map[string]int64) int64 {
	var total int64

	for status, count := range statusCounts {
		if activeDashboardStatuses[status] {
			total += count
		}
	}

	return total
}

func calculatePipelineBreakdown(statusCounts map[string]int64) models.DashboardPipelineBreakdown {
	var breakdown models.DashboardPipelineBreakdown

	for status, count := range statusCounts {
		switch {
		case activePipelineStatuses[status]:
			breakdown.ActivePipeline += count
		case status == "Interview":
			breakdown.Interviews += count
		case status == "Offer":
			breakdown.Offers += count
		default:
			breakdown.Closed += count
		}
	}

	return breakdown
}

func (r *DashboardRepository) listGroupCounts(ctx context.Context, userID int64, query string) ([]models.DashboardGroupCount, error) {
	rows, err := r.DB.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	results := []models.DashboardGroupCount{}

	for rows.Next() {
		var item models.DashboardGroupCount

		if err := rows.Scan(&item.Name, &item.Count); err != nil {
			return nil, err
		}

		results = append(results, item)
	}

	return results, rows.Err()
}

func percentage(part int64, total int64) float64 {
	if total == 0 {
		return 0
	}

	value := (float64(part) / float64(total)) * 100
	return math.Round(value*100) / 100
}

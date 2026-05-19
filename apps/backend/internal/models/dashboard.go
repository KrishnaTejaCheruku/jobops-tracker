package models

type DashboardGroupCount struct {
	Name  string `json:"name"`
	Count int64  `json:"count"`
}

type DashboardAnalytics struct {
	TotalApplications    int64   `json:"total_applications"`
	ActiveApplications   int64   `json:"active_applications"`
	ClosedApplications   int64   `json:"closed_applications"`
	Saved                int64   `json:"saved"`
	Applied              int64   `json:"applied"`
	RecruiterContacted   int64   `json:"recruiter_contacted"`
	InterviewScheduled   int64   `json:"interview_scheduled"`
	TechnicalInterview   int64   `json:"technical_interview"`
	InterviewsTotal      int64   `json:"interviews_total"`
	Offers               int64   `json:"offers"`
	Rejected             int64   `json:"rejected"`
	Ghosted              int64   `json:"ghosted"`
	Withdrawn            int64   `json:"withdrawn"`
	HighPriority         int64   `json:"high_priority"`
	OverdueFollowUps     int64   `json:"overdue_follow_ups"`
	DueTodayFollowUps    int64   `json:"due_today_follow_ups"`
	UpcomingFollowUps    int64   `json:"upcoming_follow_ups"`
	InterviewRatePercent float64 `json:"interview_rate_percent"`
	OfferRatePercent     float64 `json:"offer_rate_percent"`
	RejectionRatePercent float64 `json:"rejection_rate_percent"`

	ByStatus    []DashboardGroupCount `json:"by_status"`
	BySource    []DashboardGroupCount `json:"by_source"`
	ByPriority  []DashboardGroupCount `json:"by_priority"`
	ByWorkMode  []DashboardGroupCount `json:"by_work_mode"`
	ByCVVersion []DashboardGroupCount `json:"by_cv_version"`
}

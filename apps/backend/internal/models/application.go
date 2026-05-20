package models

import "time"

type Application struct {
	ID             int64     `json:"id"`
	JobTitle       string    `json:"job_title"`
	CompanyName    string    `json:"company_name"`
	Source         string    `json:"source"`
	JobURL         string    `json:"job_url"`
	Location       string    `json:"location"`
	WorkMode       string    `json:"work_mode"`
	Status         string    `json:"status"`
	CVVersion      string    `json:"cv_version"`
	CVVersionID    int64     `json:"cv_version_id"`
	SalaryRange    string    `json:"salary_range"`
	FollowUpDate   string    `json:"follow_up_date"`
	RecruiterName  string    `json:"recruiter_name"`
	RecruiterEmail string    `json:"recruiter_email"`
	JobDescription string    `json:"job_description"`
	Priority       string    `json:"priority"`
	Notes          string    `json:"notes"`
	AppliedDate    string    `json:"applied_date"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type CreateApplicationRequest struct {
	JobTitle       string `json:"job_title" binding:"required"`
	CompanyName    string `json:"company_name" binding:"required"`
	Source         string `json:"source"`
	JobURL         string `json:"job_url"`
	Location       string `json:"location"`
	WorkMode       string `json:"work_mode"`
	Status         string `json:"status"`
	CVVersion      string `json:"cv_version"`
	CVVersionID    int64  `json:"cv_version_id"`
	SalaryRange    string `json:"salary_range"`
	FollowUpDate   string `json:"follow_up_date"`
	RecruiterName  string `json:"recruiter_name"`
	RecruiterEmail string `json:"recruiter_email"`
	JobDescription string `json:"job_description"`
	Priority       string `json:"priority"`
	Notes          string `json:"notes"`
	AppliedDate    string `json:"applied_date"`
}

type UpdateApplicationRequest struct {
	JobTitle       string `json:"job_title" binding:"required"`
	CompanyName    string `json:"company_name" binding:"required"`
	Source         string `json:"source"`
	JobURL         string `json:"job_url"`
	Location       string `json:"location"`
	WorkMode       string `json:"work_mode"`
	Status         string `json:"status"`
	CVVersion      string `json:"cv_version"`
	CVVersionID    int64  `json:"cv_version_id"`
	SalaryRange    string `json:"salary_range"`
	FollowUpDate   string `json:"follow_up_date"`
	RecruiterName  string `json:"recruiter_name"`
	RecruiterEmail string `json:"recruiter_email"`
	JobDescription string `json:"job_description"`
	Priority       string `json:"priority"`
	Notes          string `json:"notes"`
	AppliedDate    string `json:"applied_date"`
}

type ApplicationFilters struct {
	Search   string
	Status   string
	Priority string
	Source   string
	WorkMode string
}

type ApplicationPagination struct {
	Page     int
	PageSize int
}

type ApplicationSort struct {
	SortBy    string
	SortOrder string
}

type PaginatedApplicationsResponse struct {
	Items      []Application `json:"items"`
	Page       int           `json:"page"`
	PageSize   int           `json:"page_size"`
	TotalItems int64         `json:"total_items"`
	TotalPages int           `json:"total_pages"`
	SortBy     string        `json:"sort_by"`
	SortOrder  string        `json:"sort_order"`
}

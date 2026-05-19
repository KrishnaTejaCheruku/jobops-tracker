package models

import "time"

type CVVersion struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	FocusArea string    `json:"focus_area"`
	FilePath  string    `json:"file_path"`
	Notes     string    `json:"notes"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type CreateCVVersionRequest struct {
	Name      string `json:"name" binding:"required"`
	FocusArea string `json:"focus_area"`
	FilePath  string `json:"file_path"`
	Notes     string `json:"notes"`
}

type UpdateCVVersionRequest struct {
	Name      string `json:"name" binding:"required"`
	FocusArea string `json:"focus_area"`
	FilePath  string `json:"file_path"`
	Notes     string `json:"notes"`
}

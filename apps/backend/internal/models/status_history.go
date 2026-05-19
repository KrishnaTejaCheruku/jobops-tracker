package models

import "time"

type ApplicationStatusHistory struct {
	ID            int64     `json:"id"`
	ApplicationID int64     `json:"application_id"`
	OldStatus     string    `json:"old_status"`
	NewStatus     string    `json:"new_status"`
	Note          string    `json:"note"`
	ChangedAt     time.Time `json:"changed_at"`
}

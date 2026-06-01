package models

import "time"

type AuthUser struct {
	ID        int64     `json:"id"`
	Email     string    `json:"email"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type UserOTP struct {
	ID          int64      `json:"id"`
	UserID      int64      `json:"user_id"`
	OTPHash     string     `json:"-"`
	ExpiresAt   time.Time  `json:"expires_at"`
	VerifiedAt  *time.Time `json:"verified_at,omitempty"`
	Attempts    int        `json:"attempts"`
	MaxAttempts int        `json:"max_attempts"`
	CreatedAt   time.Time  `json:"created_at"`
}

type AuthenticatedSession struct {
	SessionID int64     `json:"session_id"`
	UserID    int64     `json:"user_id"`
	Email     string    `json:"email"`
	ExpiresAt time.Time `json:"expires_at"`
}

type RequestOTPRequest struct {
	Email string `json:"email" binding:"required"`
}

type RequestOTPResponse struct {
	Message  string `json:"message"`
	DebugOTP string `json:"debug_otp,omitempty"`
}

type VerifyOTPRequest struct {
	Email string `json:"email" binding:"required"`
	OTP   string `json:"otp" binding:"required"`
}

type AuthUserResponse struct {
	User AuthUser `json:"user"`
}

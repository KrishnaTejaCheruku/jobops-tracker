package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/KrishnaTejaCheruku/jobops-tracker/apps/backend/internal/models"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrAuthRecordNotFound = errors.New("auth record not found")

type AuthRepository struct {
	db *pgxpool.Pool
}

func NewAuthRepository(db *pgxpool.Pool) *AuthRepository {
	return &AuthRepository{db: db}
}

func (r *AuthRepository) CreateOrGetUser(ctx context.Context, email string) (*models.AuthUser, error) {
	normalizedEmail := strings.ToLower(strings.TrimSpace(email))

	query := `
		INSERT INTO users (email)
		VALUES ($1)
		ON CONFLICT (email)
		DO UPDATE SET updated_at = NOW()
		RETURNING id, email, created_at, updated_at
	`

	var user models.AuthUser
	if err := r.db.QueryRow(ctx, query, normalizedEmail).Scan(
		&user.ID,
		&user.Email,
		&user.CreatedAt,
		&user.UpdatedAt,
	); err != nil {
		return nil, fmt.Errorf("create or get user: %w", err)
	}

	return &user, nil
}

func (r *AuthRepository) GetUserByEmail(ctx context.Context, email string) (*models.AuthUser, error) {
	normalizedEmail := strings.ToLower(strings.TrimSpace(email))

	query := `
		SELECT id, email, created_at, updated_at
		FROM users
		WHERE email = $1
	`

	var user models.AuthUser
	if err := r.db.QueryRow(ctx, query, normalizedEmail).Scan(
		&user.ID,
		&user.Email,
		&user.CreatedAt,
		&user.UpdatedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrAuthRecordNotFound
		}

		return nil, fmt.Errorf("get user by email: %w", err)
	}

	return &user, nil
}

func (r *AuthRepository) CreateOTP(ctx context.Context, userID int64, otpHash string, expiresAt time.Time, maxAttempts int) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin create otp transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, `
		UPDATE user_otps
		SET verified_at = NOW()
		WHERE user_id = $1
		  AND verified_at IS NULL
	`, userID)
	if err != nil {
		return fmt.Errorf("invalidate existing otps: %w", err)
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO user_otps (user_id, otp_hash, expires_at, max_attempts)
		VALUES ($1, $2, $3, $4)
	`, userID, otpHash, expiresAt, maxAttempts)
	if err != nil {
		return fmt.Errorf("insert otp: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit create otp transaction: %w", err)
	}

	return nil
}

func (r *AuthRepository) CountRecentOTPs(ctx context.Context, userID int64, since time.Time) (int, error) {
	query := `
		SELECT COUNT(*)
		FROM user_otps
		WHERE user_id = $1
		  AND created_at >= $2
	`

	var count int
	if err := r.db.QueryRow(ctx, query, userID, since).Scan(&count); err != nil {
		return 0, fmt.Errorf("count recent otps: %w", err)
	}

	return count, nil
}

func (r *AuthRepository) GetLatestActiveOTP(ctx context.Context, userID int64) (*models.UserOTP, error) {
	query := `
		SELECT id, user_id, otp_hash, expires_at, verified_at, attempts, max_attempts, created_at
		FROM user_otps
		WHERE user_id = $1
		  AND verified_at IS NULL
		ORDER BY created_at DESC
		LIMIT 1
	`

	var otp models.UserOTP
	if err := r.db.QueryRow(ctx, query, userID).Scan(
		&otp.ID,
		&otp.UserID,
		&otp.OTPHash,
		&otp.ExpiresAt,
		&otp.VerifiedAt,
		&otp.Attempts,
		&otp.MaxAttempts,
		&otp.CreatedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrAuthRecordNotFound
		}

		return nil, fmt.Errorf("get latest active otp: %w", err)
	}

	return &otp, nil
}

func (r *AuthRepository) IncrementOTPAttempts(ctx context.Context, otpID int64) error {
	_, err := r.db.Exec(ctx, `
		UPDATE user_otps
		SET attempts = attempts + 1
		WHERE id = $1
	`, otpID)
	if err != nil {
		return fmt.Errorf("increment otp attempts: %w", err)
	}

	return nil
}

func (r *AuthRepository) MarkOTPVerified(ctx context.Context, otpID int64) error {
	_, err := r.db.Exec(ctx, `
		UPDATE user_otps
		SET verified_at = NOW()
		WHERE id = $1
	`, otpID)
	if err != nil {
		return fmt.Errorf("mark otp verified: %w", err)
	}

	return nil
}

func (r *AuthRepository) CreateSession(ctx context.Context, userID int64, tokenHash string, expiresAt time.Time) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO user_sessions (user_id, token_hash, expires_at)
		VALUES ($1, $2, $3)
	`, userID, tokenHash, expiresAt)
	if err != nil {
		return fmt.Errorf("create session: %w", err)
	}

	return nil
}

func (r *AuthRepository) GetAuthenticatedSession(ctx context.Context, tokenHash string) (*models.AuthenticatedSession, error) {
	query := `
		SELECT s.id, u.id, u.email, s.expires_at
		FROM user_sessions s
		INNER JOIN users u ON u.id = s.user_id
		WHERE s.token_hash = $1
		  AND s.expires_at > NOW()
	`

	var session models.AuthenticatedSession
	if err := r.db.QueryRow(ctx, query, tokenHash).Scan(
		&session.SessionID,
		&session.UserID,
		&session.Email,
		&session.ExpiresAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrAuthRecordNotFound
		}

		return nil, fmt.Errorf("get authenticated session: %w", err)
	}

	_, _ = r.db.Exec(ctx, `
		UPDATE user_sessions
		SET last_seen_at = NOW()
		WHERE id = $1
	`, session.SessionID)

	return &session, nil
}

func (r *AuthRepository) DeleteSession(ctx context.Context, tokenHash string) error {
	_, err := r.db.Exec(ctx, `
		DELETE FROM user_sessions
		WHERE token_hash = $1
	`, tokenHash)
	if err != nil {
		return fmt.Errorf("delete session: %w", err)
	}

	return nil
}

package handlers

import (
	"context"
	"errors"
	"log"
	"net/http"
	"net/mail"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/KrishnaTejaCheruku/jobops-tracker/apps/backend/internal/middleware"
	"github.com/KrishnaTejaCheruku/jobops-tracker/apps/backend/internal/models"
	"github.com/KrishnaTejaCheruku/jobops-tracker/apps/backend/internal/repository"
	"github.com/KrishnaTejaCheruku/jobops-tracker/apps/backend/internal/services"
	"github.com/gin-gonic/gin"
)

type authStore interface {
	CreateOrGetUser(ctx context.Context, email string) (*models.AuthUser, error)
	GetUserByEmail(ctx context.Context, email string) (*models.AuthUser, error)
	UpdateUserDisplayName(ctx context.Context, userID int64, displayName string) (*models.AuthUser, error)
	CreateOTP(ctx context.Context, userID int64, otpHash string, expiresAt time.Time, maxAttempts int) error
	CountRecentOTPs(ctx context.Context, userID int64, since time.Time) (int, error)
	GetLatestActiveOTP(ctx context.Context, userID int64) (*models.UserOTP, error)
	IncrementOTPAttempts(ctx context.Context, otpID int64) error
	MarkOTPVerified(ctx context.Context, otpID int64) error
	CreateSession(ctx context.Context, userID int64, tokenHash string, expiresAt time.Time) error
	GetAuthenticatedSession(ctx context.Context, tokenHash string) (*models.AuthenticatedSession, error)
	DeleteSession(ctx context.Context, tokenHash string) error
}

type AuthHandler struct {
	authRepo     authStore
	otpService   *services.OTPService
	otpDelivery  services.OTPDelivery
	appEnv       string
	cookieSecure bool
}

func NewAuthHandler(authRepo authStore, otpService *services.OTPService, otpDelivery services.OTPDelivery) *AuthHandler {
	appEnv := strings.ToLower(strings.TrimSpace(os.Getenv("APP_ENV")))
	if otpDelivery == nil {
		otpDelivery = services.LogOTPDelivery{}
	}

	cookieSecure := false
	if strings.EqualFold(os.Getenv("AUTH_COOKIE_SECURE"), "true") {
		cookieSecure = true
	}

	return &AuthHandler{
		authRepo:     authRepo,
		otpService:   otpService,
		otpDelivery:  otpDelivery,
		appEnv:       appEnv,
		cookieSecure: cookieSecure,
	}
}

func (h *AuthHandler) RequestOTP(c *gin.Context) {
	var req models.RequestOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid request body",
		})
		return
	}

	email, err := normalizeEmail(req.Email)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "email must be valid",
		})
		return
	}

	user, err := h.authRepo.CreateOrGetUser(c.Request.Context(), email)
	if err != nil {
		log.Printf("failed to create or get user: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to request otp",
		})
		return
	}

	requestWindowStart := time.Now().UTC().Add(-services.DefaultOTPRequestWindow)
	recentOTPCount, err := h.authRepo.CountRecentOTPs(c.Request.Context(), user.ID, requestWindowStart)
	if err != nil {
		log.Printf("failed to count recent otp requests: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to request otp",
		})
		return
	}

	if recentOTPCount >= services.DefaultOTPRequestLimit {
		c.Header("Retry-After", strconv.Itoa(int(services.DefaultOTPRequestWindow.Seconds())))
		c.JSON(http.StatusTooManyRequests, gin.H{
			"error": "too many otp requests",
		})
		return
	}

	otp, err := h.otpService.GenerateOTP()
	if err != nil {
		log.Printf("failed to generate otp: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to request otp",
		})
		return
	}

	otpHash := h.otpService.HashOTP(email, otp)
	expiresAt := time.Now().UTC().Add(services.DefaultOTPTTL)

	if err := h.authRepo.CreateOTP(
		c.Request.Context(),
		user.ID,
		otpHash,
		expiresAt,
		services.DefaultOTPMaxAttempts,
	); err != nil {
		log.Printf("failed to store otp: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to request otp",
		})
		return
	}

	if err := h.otpDelivery.DeliverOTP(c.Request.Context(), email, otp); err != nil {
		log.Printf("failed to deliver otp: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to request otp",
		})
		return
	}

	response := models.RequestOTPResponse{
		Message: "OTP generated successfully.",
	}

	if h.appEnv != "production" {
		response.DebugOTP = otp
	}

	c.JSON(http.StatusOK, response)
}

func (h *AuthHandler) VerifyOTP(c *gin.Context) {
	var req models.VerifyOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid request body",
		})
		return
	}

	email, err := normalizeEmail(req.Email)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "email must be valid",
		})
		return
	}

	otpValue := strings.TrimSpace(req.OTP)
	if len(otpValue) != 6 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "otp must be a 6-digit code",
		})
		return
	}

	user, err := h.authRepo.GetUserByEmail(c.Request.Context(), email)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "invalid or expired otp",
		})
		return
	}

	otpRecord, err := h.authRepo.GetLatestActiveOTP(c.Request.Context(), user.ID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "invalid or expired otp",
		})
		return
	}

	if time.Now().UTC().After(otpRecord.ExpiresAt) {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "invalid or expired otp",
		})
		return
	}

	if otpRecord.Attempts >= otpRecord.MaxAttempts {
		c.JSON(http.StatusTooManyRequests, gin.H{
			"error": "too many otp attempts",
		})
		return
	}

	expectedHash := h.otpService.HashOTP(email, otpValue)
	if !h.otpService.ConstantTimeEqual(expectedHash, otpRecord.OTPHash) {
		if err := h.authRepo.IncrementOTPAttempts(c.Request.Context(), otpRecord.ID); err != nil {
			log.Printf("failed to increment otp attempts: %v", err)
		}

		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "invalid or expired otp",
		})
		return
	}

	if err := h.authRepo.MarkOTPVerified(c.Request.Context(), otpRecord.ID); err != nil {
		log.Printf("failed to mark otp verified: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to verify otp",
		})
		return
	}

	sessionToken, err := h.otpService.GenerateSessionToken()
	if err != nil {
		log.Printf("failed to generate session token: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to create session",
		})
		return
	}

	sessionTTL := services.DefaultSessionTTL
	sessionExpiresAt := time.Now().UTC().Add(sessionTTL)
	sessionTokenHash := h.otpService.HashSessionToken(sessionToken)

	if err := h.authRepo.CreateSession(c.Request.Context(), user.ID, sessionTokenHash, sessionExpiresAt); err != nil {
		log.Printf("failed to create session: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to create session",
		})
		return
	}

	h.setSessionCookie(c, sessionToken, sessionTTL)

	c.JSON(http.StatusOK, models.AuthUserResponse{
		User: *user,
	})
}

func (h *AuthHandler) Me(c *gin.Context) {
	token, err := c.Cookie(services.SessionCookieName)
	if err != nil || token == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "authentication required",
		})
		return
	}

	session, err := h.authRepo.GetAuthenticatedSession(
		c.Request.Context(),
		h.otpService.HashSessionToken(token),
	)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "invalid or expired session",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user": gin.H{
			"id":           session.UserID,
			"email":        session.Email,
			"display_name": session.DisplayName,
		},
	})
}

func (h *AuthHandler) UpdateProfile(c *gin.Context) {
	userID, ok := middleware.CurrentUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "authentication required",
		})
		return
	}

	var req models.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid request body",
		})
		return
	}

	displayName, err := normalizeDisplayName(req.DisplayName)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "display name must be 1-80 characters",
		})
		return
	}

	user, err := h.authRepo.UpdateUserDisplayName(c.Request.Context(), userID, displayName)
	if err != nil {
		status := http.StatusInternalServerError
		message := "failed to update profile"

		if errors.Is(err, repository.ErrAuthRecordNotFound) {
			status = http.StatusUnauthorized
			message = "authentication required"
		}

		log.Printf("failed to update auth profile: %v", err)
		c.JSON(status, gin.H{
			"error": message,
		})
		return
	}

	c.JSON(http.StatusOK, models.AuthUserResponse{
		User: *user,
	})
}

func (h *AuthHandler) Logout(c *gin.Context) {
	token, err := c.Cookie(services.SessionCookieName)
	if err == nil && token != "" {
		tokenHash := h.otpService.HashSessionToken(token)
		if err := h.authRepo.DeleteSession(c.Request.Context(), tokenHash); err != nil {
			log.Printf("failed to delete session: %v", err)
		}
	}

	h.clearSessionCookie(c)

	c.JSON(http.StatusOK, gin.H{
		"message": "logged out",
	})
}

func (h *AuthHandler) setSessionCookie(c *gin.Context, token string, ttl time.Duration) {
	maxAge := int(ttl.Seconds())

	http.SetCookie(c.Writer, &http.Cookie{
		Name:     services.SessionCookieName,
		Value:    token,
		Path:     "/",
		MaxAge:   maxAge,
		HttpOnly: true,
		Secure:   h.cookieSecure,
		SameSite: http.SameSiteLaxMode,
	})
}

func (h *AuthHandler) clearSessionCookie(c *gin.Context) {
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     services.SessionCookieName,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   h.cookieSecure,
		SameSite: http.SameSiteLaxMode,
	})
}

func normalizeEmail(value string) (string, error) {
	email := strings.ToLower(strings.TrimSpace(value))

	parsed, err := mail.ParseAddress(email)
	if err != nil {
		return "", err
	}

	normalized := strings.ToLower(strings.TrimSpace(parsed.Address))
	if normalized == "" {
		return "", errors.New("empty email")
	}

	return normalized, nil
}

func normalizeDisplayName(value string) (string, error) {
	displayName := strings.Join(strings.Fields(value), " ")
	if displayName == "" {
		return "", errors.New("empty display name")
	}

	if len([]rune(displayName)) > 80 {
		return "", errors.New("display name too long")
	}

	return displayName, nil
}

func boolEnv(name string, defaultValue bool) bool {
	value := strings.TrimSpace(os.Getenv(name))
	if value == "" {
		return defaultValue
	}

	parsed, err := strconv.ParseBool(value)
	if err != nil {
		return defaultValue
	}

	return parsed
}

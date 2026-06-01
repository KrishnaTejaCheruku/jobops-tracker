package handlers

import (
	"errors"
	"log"
	"net/http"
	"net/mail"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/KrishnaTejaCheruku/jobops-tracker/apps/backend/internal/models"
	"github.com/KrishnaTejaCheruku/jobops-tracker/apps/backend/internal/repository"
	"github.com/KrishnaTejaCheruku/jobops-tracker/apps/backend/internal/services"
	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	authRepo     *repository.AuthRepository
	otpService   *services.OTPService
	appEnv       string
	cookieSecure bool
}

func NewAuthHandler(authRepo *repository.AuthRepository, otpService *services.OTPService) *AuthHandler {
	appEnv := strings.ToLower(strings.TrimSpace(os.Getenv("APP_ENV")))

	cookieSecure := false
	if strings.EqualFold(os.Getenv("AUTH_COOKIE_SECURE"), "true") {
		cookieSecure = true
	}

	return &AuthHandler{
		authRepo:     authRepo,
		otpService:   otpService,
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

	log.Printf("auth otp generated for %s: %s", email, otp)

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
			"id":    session.UserID,
			"email": session.Email,
		},
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

package middleware

import (
	"errors"
	"net/http"

	"github.com/KrishnaTejaCheruku/jobops-tracker/apps/backend/internal/repository"
	"github.com/KrishnaTejaCheruku/jobops-tracker/apps/backend/internal/services"
	"github.com/gin-gonic/gin"
)

const (
	AuthUserIDKey    = "auth_user_id"
	AuthUserEmailKey = "auth_user_email"
)

func RequireAuth(authRepo *repository.AuthRepository, otpService *services.OTPService) gin.HandlerFunc {
	return func(c *gin.Context) {
		token, err := c.Cookie(services.SessionCookieName)
		if err != nil || token == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "authentication required",
			})
			return
		}

		tokenHash := otpService.HashSessionToken(token)

		session, err := authRepo.GetAuthenticatedSession(c.Request.Context(), tokenHash)
		if err != nil {
			status := http.StatusInternalServerError
			message := "failed to validate session"

			if errors.Is(err, repository.ErrAuthRecordNotFound) {
				status = http.StatusUnauthorized
				message = "invalid or expired session"
			}

			c.AbortWithStatusJSON(status, gin.H{
				"error": message,
			})
			return
		}

		c.Set(AuthUserIDKey, session.UserID)
		c.Set(AuthUserEmailKey, session.Email)

		c.Next()
	}
}

func CurrentUserID(c *gin.Context) (int64, bool) {
	value, exists := c.Get(AuthUserIDKey)
	if !exists {
		return 0, false
	}

	userID, ok := value.(int64)
	return userID, ok
}

func CurrentUserEmail(c *gin.Context) (string, bool) {
	value, exists := c.Get(AuthUserEmailKey)
	if !exists {
		return "", false
	}

	email, ok := value.(string)
	return email, ok
}

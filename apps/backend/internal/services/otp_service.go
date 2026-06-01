package services

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"math/big"
	"os"
	"strings"
	"time"
)

const (
	DefaultOTPTTL            = 10 * time.Minute
	DefaultSessionTTL        = 7 * 24 * time.Hour
	DefaultOTPMaxAttempts    = 5
	SessionCookieName        = "jobops_session"
	defaultDevelopmentSecret = "jobops-dev-auth-secret-change-me"
)

type OTPService struct {
	secret []byte
}

func NewOTPServiceFromEnv() *OTPService {
	secret := strings.TrimSpace(os.Getenv("AUTH_SECRET"))
	if secret == "" {
		secret = defaultDevelopmentSecret
	}

	return &OTPService{
		secret: []byte(secret),
	}
}

func ValidateAuthSecretFromEnv(appEnv string) error {
	if !strings.EqualFold(strings.TrimSpace(appEnv), "production") {
		return nil
	}

	if strings.TrimSpace(os.Getenv("AUTH_SECRET")) == "" {
		return errors.New("AUTH_SECRET is required when APP_ENV=production")
	}

	return nil
}

func (s *OTPService) GenerateOTP() (string, error) {
	max := big.NewInt(1000000)

	n, err := rand.Int(rand.Reader, max)
	if err != nil {
		return "", fmt.Errorf("generate otp: %w", err)
	}

	return fmt.Sprintf("%06d", n.Int64()), nil
}

func (s *OTPService) GenerateSessionToken() (string, error) {
	tokenBytes := make([]byte, 32)

	if _, err := rand.Read(tokenBytes); err != nil {
		return "", fmt.Errorf("generate session token: %w", err)
	}

	return hex.EncodeToString(tokenBytes), nil
}

func (s *OTPService) HashOTP(email string, otp string) string {
	normalizedEmail := strings.ToLower(strings.TrimSpace(email))
	return s.hmacHex("otp:" + normalizedEmail + ":" + otp)
}

func (s *OTPService) HashSessionToken(token string) string {
	return s.hmacHex("session:" + token)
}

func (s *OTPService) ConstantTimeEqual(a string, b string) bool {
	return hmac.Equal([]byte(a), []byte(b))
}

func (s *OTPService) hmacHex(value string) string {
	mac := hmac.New(sha256.New, s.secret)
	mac.Write([]byte(value))
	return hex.EncodeToString(mac.Sum(nil))
}

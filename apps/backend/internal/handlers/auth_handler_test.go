package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/KrishnaTejaCheruku/jobops-tracker/apps/backend/internal/models"
	"github.com/KrishnaTejaCheruku/jobops-tracker/apps/backend/internal/services"
	"github.com/gin-gonic/gin"
)

type fakeAuthStore struct {
	user           *models.AuthUser
	createErr      error
	countRecentOTP int
	countRecentErr error
	createdOTP     string
}

func (s *fakeAuthStore) CreateOrGetUser(_ context.Context, email string) (*models.AuthUser, error) {
	if s.createErr != nil {
		return nil, s.createErr
	}

	if s.user == nil {
		s.user = &models.AuthUser{ID: 1, Email: email}
	}

	return s.user, nil
}

func (s *fakeAuthStore) GetUserByEmail(_ context.Context, _ string) (*models.AuthUser, error) {
	return nil, errors.New("not implemented")
}

func (s *fakeAuthStore) CreateOTP(_ context.Context, _ int64, otpHash string, _ time.Time, _ int) error {
	s.createdOTP = otpHash
	return nil
}

func (s *fakeAuthStore) CountRecentOTPs(_ context.Context, _ int64, _ time.Time) (int, error) {
	if s.countRecentErr != nil {
		return 0, s.countRecentErr
	}

	return s.countRecentOTP, nil
}

func (s *fakeAuthStore) GetLatestActiveOTP(_ context.Context, _ int64) (*models.UserOTP, error) {
	return nil, errors.New("not implemented")
}

func (s *fakeAuthStore) IncrementOTPAttempts(_ context.Context, _ int64) error {
	return nil
}

func (s *fakeAuthStore) MarkOTPVerified(_ context.Context, _ int64) error {
	return nil
}

func (s *fakeAuthStore) CreateSession(_ context.Context, _ int64, _ string, _ time.Time) error {
	return nil
}

func (s *fakeAuthStore) GetAuthenticatedSession(_ context.Context, _ string) (*models.AuthenticatedSession, error) {
	return nil, errors.New("not implemented")
}

func (s *fakeAuthStore) DeleteSession(_ context.Context, _ string) error {
	return nil
}

type fakeOTPDelivery struct {
	email string
	otp   string
	err   error
}

func (d *fakeOTPDelivery) DeliverOTP(_ context.Context, email string, otp string) error {
	d.email = email
	d.otp = otp
	return d.err
}

func TestRequestOTPLocalModeReturnsDebugOTP(t *testing.T) {
	t.Setenv("APP_ENV", "development")
	gin.SetMode(gin.TestMode)

	store := &fakeAuthStore{}
	delivery := &fakeOTPDelivery{}
	handler := NewAuthHandler(store, services.NewOTPServiceFromEnv(), delivery)

	response := requestOTP(t, handler, "TEST@Example.COM")

	if response.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", response.Code, response.Body.String())
	}

	var body models.RequestOTPResponse
	if err := json.Unmarshal(response.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode response: %v", err)
	}

	if body.DebugOTP == "" {
		t.Fatal("expected local response to include debug_otp")
	}

	if delivery.email != "test@example.com" {
		t.Fatalf("expected normalized delivery email, got %q", delivery.email)
	}

	if delivery.otp != body.DebugOTP {
		t.Fatalf("expected delivered otp to match debug_otp, got %q and %q", delivery.otp, body.DebugOTP)
	}

	if store.createdOTP == "" {
		t.Fatal("expected otp hash to be stored")
	}
}

func TestRequestOTPProductionModeDoesNotReturnDebugOTP(t *testing.T) {
	t.Setenv("APP_ENV", "production")
	gin.SetMode(gin.TestMode)

	store := &fakeAuthStore{}
	delivery := &fakeOTPDelivery{}
	handler := NewAuthHandler(store, services.NewOTPServiceFromEnv(), delivery)

	response := requestOTP(t, handler, "test@example.com")

	if response.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", response.Code, response.Body.String())
	}

	var body models.RequestOTPResponse
	if err := json.Unmarshal(response.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode response: %v", err)
	}

	if body.DebugOTP != "" {
		t.Fatalf("expected production response to omit debug_otp, got %q", body.DebugOTP)
	}

	if delivery.otp == "" {
		t.Fatal("expected otp to be delivered")
	}
}

func TestRequestOTPReturnsErrorWhenDeliveryFails(t *testing.T) {
	t.Setenv("APP_ENV", "production")
	gin.SetMode(gin.TestMode)

	handler := NewAuthHandler(
		&fakeAuthStore{},
		services.NewOTPServiceFromEnv(),
		&fakeOTPDelivery{err: errors.New("smtp unavailable")},
	)

	response := requestOTP(t, handler, "test@example.com")

	if response.Code != http.StatusInternalServerError {
		t.Fatalf("expected status 500, got %d: %s", response.Code, response.Body.String())
	}
}

func TestRequestOTPAllowsRequestBelowRateLimit(t *testing.T) {
	t.Setenv("APP_ENV", "development")
	gin.SetMode(gin.TestMode)

	store := &fakeAuthStore{
		countRecentOTP: services.DefaultOTPRequestLimit - 1,
	}
	delivery := &fakeOTPDelivery{}
	handler := NewAuthHandler(store, services.NewOTPServiceFromEnv(), delivery)

	response := requestOTP(t, handler, "test@example.com")

	if response.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", response.Code, response.Body.String())
	}

	if store.createdOTP == "" {
		t.Fatal("expected otp to be stored when request is below rate limit")
	}

	if delivery.otp == "" {
		t.Fatal("expected otp to be delivered when request is below rate limit")
	}
}

func TestRequestOTPRejectsRequestAtRateLimit(t *testing.T) {
	t.Setenv("APP_ENV", "development")
	gin.SetMode(gin.TestMode)

	store := &fakeAuthStore{
		countRecentOTP: services.DefaultOTPRequestLimit,
	}
	delivery := &fakeOTPDelivery{}
	handler := NewAuthHandler(store, services.NewOTPServiceFromEnv(), delivery)

	response := requestOTP(t, handler, "test@example.com")

	if response.Code != http.StatusTooManyRequests {
		t.Fatalf("expected status 429, got %d: %s", response.Code, response.Body.String())
	}

	if store.createdOTP != "" {
		t.Fatal("expected throttled request not to store otp")
	}

	if delivery.otp != "" {
		t.Fatal("expected throttled request not to deliver otp")
	}
}

func requestOTP(t *testing.T, handler *AuthHandler, email string) *httptest.ResponseRecorder {
	t.Helper()

	router := gin.New()
	router.POST("/auth/request-otp", handler.RequestOTP)

	body := bytes.NewBufferString(`{"email": "` + email + `"}`)
	req := httptest.NewRequest(http.MethodPost, "/auth/request-otp", body)
	req.Header.Set("Content-Type", "application/json")

	response := httptest.NewRecorder()
	router.ServeHTTP(response, req)
	return response
}

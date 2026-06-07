package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/KrishnaTejaCheruku/jobops-tracker/apps/backend/internal/models"
	"github.com/gin-gonic/gin"
)

func TestCaptureAnalyzeRejectsOversizedBody(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	handler := NewCaptureAnalyzeHandlerWithClient(true, "http://example.test", 16, nil)
	router.POST("/capture/analyze", handler.Analyze)

	req := httptest.NewRequest(http.MethodPost, "/capture/analyze", strings.NewReader(`{"dom_text":"this body is too large"}`))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)

	if resp.Code != http.StatusRequestEntityTooLarge {
		t.Fatalf("expected status %d, got %d", http.StatusRequestEntityTooLarge, resp.Code)
	}
}

func TestCaptureAnalyzeHandlesOCRServiceUnavailable(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	handler := NewCaptureAnalyzeHandlerWithClient(true, "http://127.0.0.1:1", 6000000, nil)
	router.POST("/capture/analyze", handler.Analyze)

	req := httptest.NewRequest(http.MethodPost, "/capture/analyze", strings.NewReader(`{"dom_text":"DevOps Engineer Star Finanz Hamburg Hybrid"}`))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)

	if resp.Code != http.StatusBadGateway {
		t.Fatalf("expected status %d, got %d", http.StatusBadGateway, resp.Code)
	}
}

func TestCaptureAnalyzeNormalizesOCRResponse(t *testing.T) {
	gin.SetMode(gin.TestMode)

	ocr := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/analyze" {
			t.Fatalf("expected /analyze path, got %s", r.URL.Path)
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{
			"job_title": "DevOps Engineer",
			"company_name": "Star Finanz",
			"source": "LinkedIn",
			"location": "Hamburg, Germany",
			"confidence": {"job_title": 0.8, "company_name": 0.7, "location": 0.6},
			"raw_text": "DevOps Engineer Star Finanz Hamburg Hybrid"
		}`))
	}))
	defer ocr.Close()

	router := gin.New()
	handler := NewCaptureAnalyzeHandlerWithClient(true, ocr.URL, 6000000, ocr.Client())
	router.POST("/capture/analyze", handler.Analyze)

	req := httptest.NewRequest(http.MethodPost, "/capture/analyze", strings.NewReader(`{
		"url": "https://www.linkedin.com/jobs/view/123",
		"title": "Star Finanz hiring DevOps Engineer in Hamburg, Germany | LinkedIn",
		"dom_text": "DevOps Engineer Star Finanz Hamburg, Germany Hybrid"
	}`))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)

	if resp.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d: %s", http.StatusOK, resp.Code, resp.Body.String())
	}

	var payload models.CaptureAnalyzeResponse
	if err := json.Unmarshal(resp.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}

	if payload.JobTitle != "DevOps Engineer" {
		t.Fatalf("expected job title to be normalized, got %q", payload.JobTitle)
	}
	if payload.CompanyName != "Star Finanz" {
		t.Fatalf("expected company name Star Finanz, got %q", payload.CompanyName)
	}
	if payload.JobURL != "https://www.linkedin.com/jobs/view/123" {
		t.Fatalf("expected fallback job URL, got %q", payload.JobURL)
	}
	if payload.WorkMode != "Hybrid" {
		t.Fatalf("expected default work mode Hybrid, got %q", payload.WorkMode)
	}
	if payload.Status != "Saved" {
		t.Fatalf("expected default status Saved, got %q", payload.Status)
	}
	if payload.Priority != "Medium" {
		t.Fatalf("expected default priority Medium, got %q", payload.Priority)
	}
}

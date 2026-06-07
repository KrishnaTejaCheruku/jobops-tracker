package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/KrishnaTejaCheruku/jobops-tracker/apps/backend/internal/models"
	"github.com/gin-gonic/gin"
)

type CaptureAnalyzeHandler struct {
	enabled  bool
	ocrURL   string
	maxBytes int64
	client   *http.Client
}

func NewCaptureAnalyzeHandler(enabled bool, ocrURL string, maxBytes int64) *CaptureAnalyzeHandler {
	return NewCaptureAnalyzeHandlerWithClient(enabled, ocrURL, maxBytes, &http.Client{
		Timeout: 20 * time.Second,
	})
}

func NewCaptureAnalyzeHandlerWithClient(enabled bool, ocrURL string, maxBytes int64, client *http.Client) *CaptureAnalyzeHandler {
	if maxBytes <= 0 {
		maxBytes = 6000000
	}
	if client == nil {
		client = &http.Client{Timeout: 20 * time.Second}
	}

	return &CaptureAnalyzeHandler{
		enabled:  enabled,
		ocrURL:   strings.TrimRight(strings.TrimSpace(ocrURL), "/"),
		maxBytes: maxBytes,
		client:   client,
	}
}

func (h *CaptureAnalyzeHandler) Analyze(c *gin.Context) {
	if !h.enabled {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "capture analyze is disabled"})
		return
	}

	if !isJSONContentType(c.GetHeader("Content-Type")) {
		c.JSON(http.StatusUnsupportedMediaType, gin.H{"error": "content type must be application/json"})
		return
	}

	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, h.maxBytes)

	var req models.CaptureAnalyzeRequest
	decoder := json.NewDecoder(c.Request.Body)
	if err := decoder.Decode(&req); err != nil {
		status := http.StatusBadRequest
		if strings.Contains(err.Error(), "http: request body too large") {
			status = http.StatusRequestEntityTooLarge
		}
		c.JSON(status, gin.H{"error": "invalid request body"})
		return
	}

	resp, err := h.forwardToOCR(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "capture OCR service unavailable"})
		return
	}

	c.JSON(http.StatusOK, normalizeCaptureAnalyzeResponse(req, resp))
}

func (h *CaptureAnalyzeHandler) forwardToOCR(ctx context.Context, req models.CaptureAnalyzeRequest) (models.CaptureOCRResponse, error) {
	if h.ocrURL == "" {
		return models.CaptureOCRResponse{}, fmt.Errorf("capture OCR URL is not configured")
	}

	payload, err := json.Marshal(req)
	if err != nil {
		return models.CaptureOCRResponse{}, err
	}

	endpoint, err := url.JoinPath(h.ocrURL, "/analyze")
	if err != nil {
		return models.CaptureOCRResponse{}, err
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(payload))
	if err != nil {
		return models.CaptureOCRResponse{}, err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Accept", "application/json")

	httpResp, err := h.client.Do(httpReq)
	if err != nil {
		return models.CaptureOCRResponse{}, err
	}
	defer httpResp.Body.Close()

	if httpResp.StatusCode < 200 || httpResp.StatusCode >= 300 {
		io.Copy(io.Discard, httpResp.Body)
		return models.CaptureOCRResponse{}, fmt.Errorf("capture OCR returned status %d", httpResp.StatusCode)
	}

	var resp models.CaptureOCRResponse
	if err := json.NewDecoder(httpResp.Body).Decode(&resp); err != nil {
		return models.CaptureOCRResponse{}, err
	}

	return resp, nil
}

func normalizeCaptureAnalyzeResponse(req models.CaptureAnalyzeRequest, resp models.CaptureOCRResponse) models.CaptureAnalyzeResponse {
	normalized := resp.CaptureAnalyzeResponse

	if strings.TrimSpace(normalized.JobURL) == "" {
		normalized.JobURL = strings.TrimSpace(req.URL)
	}
	if strings.TrimSpace(normalized.Source) == "" {
		normalized.Source = sourceFromURL(normalized.JobURL)
	}
	if strings.TrimSpace(normalized.WorkMode) == "" {
		normalized.WorkMode = "Hybrid"
	}
	if strings.TrimSpace(normalized.Status) == "" {
		normalized.Status = "Saved"
	}
	if strings.TrimSpace(normalized.Priority) == "" {
		normalized.Priority = "Medium"
	}
	if strings.TrimSpace(normalized.Notes) == "" {
		normalized.Notes = "Extracted from screenshot. Please review before saving."
	}

	return normalized
}

func isJSONContentType(value string) bool {
	mediaType := strings.ToLower(strings.TrimSpace(strings.Split(value, ";")[0]))
	return mediaType == "application/json"
}

func sourceFromURL(value string) string {
	parsed, err := url.Parse(value)
	if err != nil {
		return "Other"
	}

	host := strings.ToLower(parsed.Hostname())
	switch {
	case strings.Contains(host, "linkedin.com"):
		return "LinkedIn"
	case strings.Contains(host, "indeed."):
		return "Other"
	case strings.Contains(host, "stepstone."):
		return "Other"
	case strings.Contains(host, "greenhouse.io"):
		return "Company Website"
	case strings.Contains(host, "lever.co"):
		return "Company Website"
	case strings.Contains(host, "workdayjobs.com"), strings.Contains(host, "myworkdayjobs.com"):
		return "Company Website"
	case host != "":
		return "Company Website"
	default:
		return "Other"
	}
}

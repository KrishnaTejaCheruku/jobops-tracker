package config

import (
	"reflect"
	"testing"
)

func TestLoadUsesDefaultCORSAllowedOrigins(t *testing.T) {
	t.Setenv("CORS_ALLOWED_ORIGINS", "")

	cfg := Load()

	expected := defaultCORSAllowedOrigins()
	if !reflect.DeepEqual(cfg.CORSAllowedOrigins, expected) {
		t.Fatalf("expected default CORS origins %v, got %v", expected, cfg.CORSAllowedOrigins)
	}
}

func TestLoadParsesCORSAllowedOrigins(t *testing.T) {
	t.Setenv("CORS_ALLOWED_ORIGINS", " https://jobops.me,https://www.jobops.me, https://jobops.me ,,http://localhost:5173 ")

	cfg := Load()

	expected := []string{
		"https://jobops.me",
		"https://www.jobops.me",
		"http://localhost:5173",
	}
	if !reflect.DeepEqual(cfg.CORSAllowedOrigins, expected) {
		t.Fatalf("expected CORS origins %v, got %v", expected, cfg.CORSAllowedOrigins)
	}
}

func TestConfigAllowsConfiguredCORSOrigins(t *testing.T) {
	cfg := Config{
		CORSAllowedOrigins: []string{
			"https://jobops.me",
			"https://www.jobops.me",
		},
	}

	if !cfg.IsCORSOriginAllowed("https://jobops.me") {
		t.Fatal("expected configured origin to be allowed")
	}
	if cfg.IsCORSOriginAllowed("https://evil.example") {
		t.Fatal("expected unconfigured web origin to be rejected")
	}
}

func TestConfigAllowsChromeExtensionCORSOrigins(t *testing.T) {
	cfg := Config{
		CORSAllowedOrigins: []string{
			"https://jobops.me",
		},
	}

	if !cfg.IsCORSOriginAllowed("chrome-extension://abcdefghijklmnopabcdefghijklmnop") {
		t.Fatal("expected Chrome extension origin to be allowed")
	}
}

func TestLoadUsesCaptureAnalyzeDevelopmentDefaults(t *testing.T) {
	t.Setenv("APP_ENV", "development")
	t.Setenv("CAPTURE_ANALYZE_ENABLED", "")
	t.Setenv("CAPTURE_OCR_URL", "")
	t.Setenv("CAPTURE_MAX_BYTES", "")

	cfg := Load()

	if !cfg.CaptureAnalyzeEnabled {
		t.Fatal("expected capture analyze to default enabled in development")
	}
	if cfg.CaptureOCRURL != "http://capture-ocr:8090" {
		t.Fatalf("expected default capture OCR URL, got %q", cfg.CaptureOCRURL)
	}
	if cfg.CaptureMaxBytes != 6000000 {
		t.Fatalf("expected default capture max bytes 6000000, got %d", cfg.CaptureMaxBytes)
	}
}

func TestLoadParsesCaptureAnalyzeEnvironment(t *testing.T) {
	t.Setenv("APP_ENV", "production")
	t.Setenv("CAPTURE_ANALYZE_ENABLED", "true")
	t.Setenv("CAPTURE_OCR_URL", "http://ocr.example.test:8090")
	t.Setenv("CAPTURE_MAX_BYTES", "1234")

	cfg := Load()

	if !cfg.CaptureAnalyzeEnabled {
		t.Fatal("expected capture analyze to be enabled from env")
	}
	if cfg.CaptureOCRURL != "http://ocr.example.test:8090" {
		t.Fatalf("expected configured capture OCR URL, got %q", cfg.CaptureOCRURL)
	}
	if cfg.CaptureMaxBytes != 1234 {
		t.Fatalf("expected configured capture max bytes, got %d", cfg.CaptureMaxBytes)
	}
}

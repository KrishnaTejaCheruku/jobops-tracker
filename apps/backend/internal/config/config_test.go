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

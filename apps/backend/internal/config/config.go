package config

import (
	"os"
	"strconv"
	"strings"
)

type Config struct {
	AppName               string
	AppEnv                string
	ServerPort            string
	DatabaseURL           string
	CORSAllowedOrigins    []string
	CaptureAnalyzeEnabled bool
	CaptureOCRURL         string
	CaptureMaxBytes       int64
}

func Load() Config {
	appEnv := getEnv("APP_ENV", "development")

	return Config{
		AppName:            getEnv("APP_NAME", "jobops-tracker"),
		AppEnv:             appEnv,
		ServerPort:         getEnv("BACKEND_PORT", "8000"),
		DatabaseURL:        getEnv("DATABASE_URL", "postgresql://jobops:jobops_dev_password@localhost:5432/jobops"),
		CORSAllowedOrigins: parseCSVEnv("CORS_ALLOWED_ORIGINS", defaultCORSAllowedOrigins()),
		CaptureAnalyzeEnabled: parseBoolEnv(
			"CAPTURE_ANALYZE_ENABLED",
			defaultCaptureAnalyzeEnabled(appEnv),
		),
		CaptureOCRURL:   getEnv("CAPTURE_OCR_URL", "http://capture-ocr:8090"),
		CaptureMaxBytes: parseInt64Env("CAPTURE_MAX_BYTES", 6000000),
	}
}

func getEnv(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}

func parseCSVEnv(key string, fallback []string) []string {
	raw := strings.TrimSpace(os.Getenv(key))
	if raw == "" {
		return fallback
	}

	parts := strings.Split(raw, ",")
	values := make([]string, 0, len(parts))
	seen := make(map[string]struct{}, len(parts))
	for _, part := range parts {
		value := strings.TrimSpace(part)
		if value == "" {
			continue
		}
		if _, ok := seen[value]; ok {
			continue
		}
		seen[value] = struct{}{}
		values = append(values, value)
	}

	if len(values) == 0 {
		return fallback
	}

	return values
}

func parseBoolEnv(key string, fallback bool) bool {
	raw := strings.TrimSpace(os.Getenv(key))
	if raw == "" {
		return fallback
	}

	value, err := strconv.ParseBool(raw)
	if err != nil {
		return fallback
	}

	return value
}

func parseInt64Env(key string, fallback int64) int64 {
	raw := strings.TrimSpace(os.Getenv(key))
	if raw == "" {
		return fallback
	}

	value, err := strconv.ParseInt(raw, 10, 64)
	if err != nil || value <= 0 {
		return fallback
	}

	return value
}

func defaultCaptureAnalyzeEnabled(appEnv string) bool {
	return strings.TrimSpace(strings.ToLower(appEnv)) != "production"
}

func defaultCORSAllowedOrigins() []string {
	return []string{
		"http://localhost:5173",
		"http://localhost:3000",
		"http://localhost:8080",
		"http://localhost:8081",
		"http://localhost",
		"http://94.130.75.66",
		"https://jobops.me",
		"https://www.jobops.me",
	}
}

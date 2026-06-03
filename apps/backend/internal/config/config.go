package config

import (
	"os"
	"strings"
)

type Config struct {
	AppName            string
	AppEnv             string
	ServerPort         string
	DatabaseURL        string
	CORSAllowedOrigins []string
}

func Load() Config {
	return Config{
		AppName:            getEnv("APP_NAME", "jobops-tracker"),
		AppEnv:             getEnv("APP_ENV", "development"),
		ServerPort:         getEnv("BACKEND_PORT", "8000"),
		DatabaseURL:        getEnv("DATABASE_URL", "postgresql://jobops:jobops_dev_password@localhost:5432/jobops"),
		CORSAllowedOrigins: parseCSVEnv("CORS_ALLOWED_ORIGINS", defaultCORSAllowedOrigins()),
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

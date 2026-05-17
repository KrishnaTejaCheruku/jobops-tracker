package config

import "os"

type Config struct {
	AppName     string
	AppEnv      string
	ServerPort  string
	DatabaseURL string
}

func Load() Config {
	return Config{
		AppName:     getEnv("APP_NAME", "jobops-tracker"),
		AppEnv:      getEnv("APP_ENV", "development"),
		ServerPort:  getEnv("BACKEND_PORT", "8000"),
		DatabaseURL: getEnv("DATABASE_URL", "postgresql://jobops:jobops_dev_password@localhost:5432/jobops"),
	}
}

func getEnv(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}

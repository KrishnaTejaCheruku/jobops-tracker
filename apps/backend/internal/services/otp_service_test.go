package services

import "testing"

func TestValidateAuthSecretFromEnvRequiresProductionSecret(t *testing.T) {
	t.Setenv("AUTH_SECRET", "")

	if err := ValidateAuthSecretFromEnv("production"); err == nil {
		t.Fatal("expected production AUTH_SECRET validation error")
	}
}

func TestValidateAuthSecretFromEnvAllowsDevelopmentWithoutSecret(t *testing.T) {
	t.Setenv("AUTH_SECRET", "")

	if err := ValidateAuthSecretFromEnv("development"); err != nil {
		t.Fatalf("expected development without AUTH_SECRET to be valid, got: %v", err)
	}
}

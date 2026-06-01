package services

import "testing"

func TestNewOTPDeliveryFromEnvDefaultsToLogOutsideProduction(t *testing.T) {
	t.Setenv("OTP_DELIVERY_MODE", "")

	delivery, err := NewOTPDeliveryFromEnv("development")
	if err != nil {
		t.Fatalf("expected log delivery, got error: %v", err)
	}

	if _, ok := delivery.(LogOTPDelivery); !ok {
		t.Fatalf("expected LogOTPDelivery, got %T", delivery)
	}
}

func TestNewOTPDeliveryFromEnvDefaultsProductionToSMTP(t *testing.T) {
	t.Setenv("OTP_DELIVERY_MODE", "")
	t.Setenv("SMTP_HOST", "")
	t.Setenv("SMTP_FROM", "")

	if _, err := NewOTPDeliveryFromEnv("production"); err == nil {
		t.Fatal("expected missing SMTP config error")
	}
}

func TestNewSMTPOTPDeliveryFromEnv(t *testing.T) {
	t.Setenv("SMTP_HOST", "smtp.example.com")
	t.Setenv("SMTP_PORT", "2525")
	t.Setenv("SMTP_USERNAME", "jobops")
	t.Setenv("SMTP_PASSWORD", "secret")
	t.Setenv("SMTP_FROM", "noreply@example.com")
	t.Setenv("SMTP_FROM_NAME", "JobOps Tracker")

	delivery, err := NewSMTPOTPDeliveryFromEnv()
	if err != nil {
		t.Fatalf("expected smtp delivery config, got error: %v", err)
	}

	if delivery.Host != "smtp.example.com" {
		t.Fatalf("expected SMTP host to be loaded, got %q", delivery.Host)
	}

	if delivery.Port != 2525 {
		t.Fatalf("expected SMTP port 2525, got %d", delivery.Port)
	}

	if delivery.From != "noreply@example.com" {
		t.Fatalf("expected SMTP from address to be loaded, got %q", delivery.From)
	}
}

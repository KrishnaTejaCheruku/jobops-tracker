package services

import (
	"context"
	"strings"
	"testing"
)

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

func TestSMTPOTPDeliveryRejectsRecipientHeaderInjection(t *testing.T) {
	delivery := SMTPOTPDelivery{
		Host: "smtp.example.com",
		Port: 587,
		From: "noreply@example.com",
	}

	err := delivery.DeliverOTP(
		context.Background(),
		"owner@example.com\r\nBcc: attacker@example.com",
		"123456",
	)
	if err == nil {
		t.Fatal("expected recipient header injection to be rejected")
	}

	if !strings.Contains(err.Error(), "invalid characters") {
		t.Fatalf("expected invalid character error, got %q", err.Error())
	}
}

func TestSMTPOTPDeliveryRejectsSenderHeaderInjection(t *testing.T) {
	tests := []struct {
		name     string
		delivery SMTPOTPDelivery
	}{
		{
			name: "from address",
			delivery: SMTPOTPDelivery{
				Host: "smtp.example.com",
				Port: 587,
				From: "noreply@example.com\r\nBcc: attacker@example.com",
			},
		},
		{
			name: "from name",
			delivery: SMTPOTPDelivery{
				Host:     "smtp.example.com",
				Port:     587,
				From:     "noreply@example.com",
				FromName: "JobOps\r\nBcc: attacker@example.com",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.delivery.DeliverOTP(context.Background(), "owner@example.com", "123456")
			if err == nil {
				t.Fatal("expected sender header injection to be rejected")
			}

			if !strings.Contains(err.Error(), "sender configuration") {
				t.Fatalf("expected sender configuration error, got %q", err.Error())
			}
		})
	}
}

func TestSMTPOTPDeliveryRejectsInvalidRecipientEmail(t *testing.T) {
	delivery := SMTPOTPDelivery{
		Host: "smtp.example.com",
		Port: 587,
		From: "noreply@example.com",
	}

	err := delivery.DeliverOTP(context.Background(), "not an email address", "123456")
	if err == nil {
		t.Fatal("expected invalid recipient email to be rejected")
	}

	if !strings.Contains(err.Error(), "must be valid") {
		t.Fatalf("expected valid email error, got %q", err.Error())
	}
}

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
	delivery := SMTPOTPDelivery{
		Host: "smtp.example.com",
		Port: 587,
		From: "noreply@example.com\r\nBcc: attacker@example.com",
	}

	err := delivery.DeliverOTP(context.Background(), "owner@example.com", "123456")
	if err == nil {
		t.Fatal("expected sender header injection to be rejected")
	}

	if !strings.Contains(err.Error(), "sender configuration") {
		t.Fatalf("expected sender configuration error, got %q", err.Error())
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

func TestSMTPOTPDeliveryBuildsSafeMessageHeaders(t *testing.T) {
	delivery := SMTPOTPDelivery{
		Host:     "smtp.example.com",
		Port:     587,
		From:     "noreply@example.com",
		FromName: "JobOps Tracker",
	}

	message, err := delivery.message("owner@example.com", "123456", loginCodeSubject)
	if err != nil {
		t.Fatalf("expected message to build, got error: %v", err)
	}

	body := string(message)
	assertHeaderCount(t, body, "From:", 1)
	assertHeaderCount(t, body, "To:", 1)
	assertHeaderCount(t, body, "Subject:", 1)

	if !strings.Contains(body, "From: \"JobOps Tracker\" <noreply@example.com>") {
		t.Fatalf("expected formatted From header, got:\n%s", body)
	}
	if !strings.Contains(body, "To: <owner@example.com>") {
		t.Fatalf("expected formatted To header, got:\n%s", body)
	}
	if !strings.Contains(body, "Subject: Your JobOps Tracker login code") {
		t.Fatalf("expected login subject, got:\n%s", body)
	}
	if !strings.Contains(body, "Your JobOps Tracker login code is 123456.") {
		t.Fatalf("expected OTP body to be preserved, got:\n%s", body)
	}
}

func TestSMTPOTPDeliverySanitizesDisplayNameAndSubjectHeaders(t *testing.T) {
	delivery := SMTPOTPDelivery{
		Host:     "smtp.example.com",
		Port:     587,
		From:     "noreply@example.com",
		FromName: "JobOps\r\nBcc: attacker@example.com",
	}

	message, err := delivery.message(
		"owner@example.com",
		"123456",
		"Your code\r\nBcc: attacker@example.com",
	)
	if err != nil {
		t.Fatalf("expected sanitized message to build, got error: %v", err)
	}

	body := string(message)
	assertHeaderCount(t, body, "From:", 1)
	assertHeaderCount(t, body, "To:", 1)
	assertHeaderCount(t, body, "Subject:", 1)

	if strings.Contains(body, "\r\nBcc:") || strings.Contains(body, "\nBcc:") {
		t.Fatalf("expected injected Bcc header to be removed, got:\n%s", body)
	}
	if !strings.Contains(body, "JobOpsBcc: attacker@example.com") {
		t.Fatalf("expected display name text to be sanitized without a new header, got:\n%s", body)
	}
	if !strings.Contains(body, "Subject: Your codeBcc: attacker@example.com") {
		t.Fatalf("expected subject text to be sanitized without a new header, got:\n%s", body)
	}
}

func TestSMTPOTPDeliveryRejectsSenderAddressHeaderInjectionInMessage(t *testing.T) {
	delivery := SMTPOTPDelivery{
		Host: "smtp.example.com",
		Port: 587,
		From: "noreply@example.com\r\nBcc: attacker@example.com",
	}

	_, err := delivery.message("owner@example.com", "123456", loginCodeSubject)
	if err == nil {
		t.Fatal("expected sender address injection to be rejected")
	}
}

func TestSMTPOTPDeliveryRejectsRecipientHeaderInjectionInMessage(t *testing.T) {
	delivery := SMTPOTPDelivery{
		Host: "smtp.example.com",
		Port: 587,
		From: "noreply@example.com",
	}

	_, err := delivery.message("owner@example.com\r\nBcc: attacker@example.com", "123456", loginCodeSubject)
	if err == nil {
		t.Fatal("expected recipient header injection to be rejected")
	}
}

func assertHeaderCount(t *testing.T, message string, header string, expected int) {
	t.Helper()

	count := 0
	for _, line := range strings.Split(message, "\r\n") {
		if strings.HasPrefix(line, header) {
			count++
		}
	}

	if count != expected {
		t.Fatalf("expected %d %s header(s), got %d in:\n%s", expected, header, count, message)
	}
}

package services

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/smtp"
	"os"
	"strconv"
	"strings"
)

type OTPDelivery interface {
	DeliverOTP(ctx context.Context, email string, otp string) error
}

type LogOTPDelivery struct{}

func (d LogOTPDelivery) DeliverOTP(_ context.Context, email string, otp string) error {
	log.Printf("auth otp generated for %s: %s", email, otp)
	return nil
}

type SMTPOTPDelivery struct {
	Host     string
	Port     int
	Username string
	Password string
	From     string
	FromName string
}

func NewOTPDeliveryFromEnv(appEnv string) (OTPDelivery, error) {
	mode := strings.ToLower(strings.TrimSpace(os.Getenv("OTP_DELIVERY_MODE")))
	if mode == "" {
		if strings.EqualFold(appEnv, "production") {
			mode = "smtp"
		} else {
			mode = "log"
		}
	}

	switch mode {
	case "log":
		if strings.EqualFold(appEnv, "production") {
			log.Print("warning: OTP_DELIVERY_MODE=log in production; OTPs will only be written to backend logs")
		}
		return LogOTPDelivery{}, nil
	case "smtp":
		return NewSMTPOTPDeliveryFromEnv()
	default:
		return nil, fmt.Errorf("unsupported OTP_DELIVERY_MODE %q", mode)
	}
}

func NewSMTPOTPDeliveryFromEnv() (*SMTPOTPDelivery, error) {
	port, err := parseSMTPPort(os.Getenv("SMTP_PORT"))
	if err != nil {
		return nil, err
	}

	delivery := &SMTPOTPDelivery{
		Host:     strings.TrimSpace(os.Getenv("SMTP_HOST")),
		Port:     port,
		Username: strings.TrimSpace(os.Getenv("SMTP_USERNAME")),
		Password: os.Getenv("SMTP_PASSWORD"),
		From:     strings.TrimSpace(os.Getenv("SMTP_FROM")),
		FromName: strings.TrimSpace(os.Getenv("SMTP_FROM_NAME")),
	}

	if delivery.Host == "" {
		return nil, errors.New("SMTP_HOST is required when OTP_DELIVERY_MODE=smtp")
	}

	if delivery.From == "" {
		return nil, errors.New("SMTP_FROM is required when OTP_DELIVERY_MODE=smtp")
	}

	return delivery, nil
}

func (d *SMTPOTPDelivery) DeliverOTP(_ context.Context, email string, otp string) error {
	to := strings.TrimSpace(email)
	if to == "" {
		return errors.New("otp recipient email is required")
	}

	addr := fmt.Sprintf("%s:%d", d.Host, d.Port)
	var auth smtp.Auth
	if d.Username != "" {
		auth = smtp.PlainAuth("", d.Username, d.Password, d.Host)
	}

	if err := smtp.SendMail(addr, auth, d.From, []string{to}, d.message(to, otp)); err != nil {
		return fmt.Errorf("send otp email: %w", err)
	}

	return nil
}

func (d *SMTPOTPDelivery) message(to string, otp string) []byte {
	from := d.From
	if d.FromName != "" {
		from = fmt.Sprintf("%s <%s>", d.FromName, d.From)
	}

	body := strings.Join([]string{
		fmt.Sprintf("From: %s", from),
		fmt.Sprintf("To: %s", to),
		"Subject: Your JobOps Tracker login code",
		"MIME-Version: 1.0",
		"Content-Type: text/plain; charset=UTF-8",
		"",
		"Your JobOps Tracker login code is " + otp + ".",
		"",
		"This code expires in 10 minutes.",
		"",
	}, "\r\n")

	return []byte(body)
}

func parseSMTPPort(value string) (int, error) {
	value = strings.TrimSpace(value)
	if value == "" {
		return 587, nil
	}

	port, err := strconv.Atoi(value)
	if err != nil || port <= 0 {
		return 0, errors.New("SMTP_PORT must be a positive integer")
	}

	return port, nil
}

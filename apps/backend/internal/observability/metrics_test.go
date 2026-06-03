package observability

import (
	"strings"
	"testing"
	"time"
)

func TestRegistryRendersHTTPRequestMetrics(t *testing.T) {
	registry := NewRegistry()

	registry.ObserveHTTPRequest("get", "/health", 200, 12*time.Millisecond)
	registry.ObserveHTTPRequest("POST", "/auth/request-otp", 429, 250*time.Millisecond)

	output := registry.Render(nil)

	expectedParts := []string{
		"# TYPE jobops_app_uptime_seconds gauge",
		"jobops_database_up 0",
		`jobops_http_requests_total{method="GET",route="/health",status="200"} 1`,
		`jobops_http_requests_total{method="POST",route="/auth/request-otp",status="429"} 1`,
		`jobops_http_request_duration_seconds_count{method="GET",route="/health",status="200"} 1`,
		`jobops_http_request_duration_seconds_bucket{method="POST",route="/auth/request-otp",status="429",le="+Inf"} 1`,
	}

	for _, expected := range expectedParts {
		if !strings.Contains(output, expected) {
			t.Fatalf("expected metrics output to contain %q, got:\n%s", expected, output)
		}
	}
}

func TestEscapeLabelValue(t *testing.T) {
	got := escapeLabelValue("line\nquote\"slash\\")
	want := `line\nquote\"slash\\`

	if got != want {
		t.Fatalf("expected escaped label %q, got %q", want, got)
	}
}

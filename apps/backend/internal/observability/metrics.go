package observability

import (
	"context"
	"fmt"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

var defaultDurationBuckets = []float64{0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5}

type requestKey struct {
	Method string
	Route  string
	Status int
}

type requestStats struct {
	Count     uint64
	Duration  float64
	Histogram []uint64
}

type Registry struct {
	mu              sync.Mutex
	startedAt       time.Time
	durationBuckets []float64
	requests        map[requestKey]*requestStats
}

func NewRegistry() *Registry {
	return &Registry{
		startedAt:       time.Now().UTC(),
		durationBuckets: append([]float64(nil), defaultDurationBuckets...),
		requests:        make(map[requestKey]*requestStats),
	}
}

func (r *Registry) Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.URL.Path == "/metrics" {
			c.Next()
			return
		}

		start := time.Now()
		c.Next()

		route := c.FullPath()
		if route == "" {
			route = "unmatched"
		}

		r.ObserveHTTPRequest(
			c.Request.Method,
			route,
			c.Writer.Status(),
			time.Since(start),
		)
	}
}

func (r *Registry) ObserveHTTPRequest(method string, route string, status int, duration time.Duration) {
	r.mu.Lock()
	defer r.mu.Unlock()

	key := requestKey{
		Method: strings.ToUpper(strings.TrimSpace(method)),
		Route:  strings.TrimSpace(route),
		Status: status,
	}
	if key.Method == "" {
		key.Method = "UNKNOWN"
	}
	if key.Route == "" {
		key.Route = "unknown"
	}

	stats, ok := r.requests[key]
	if !ok {
		stats = &requestStats{
			Histogram: make([]uint64, len(r.durationBuckets)),
		}
		r.requests[key] = stats
	}

	seconds := duration.Seconds()
	stats.Count++
	stats.Duration += seconds
	for i, bucket := range r.durationBuckets {
		if seconds <= bucket {
			stats.Histogram[i]++
		}
	}
}

func (r *Registry) Render(db *pgxpool.Pool) string {
	dbStatus := 0
	if db != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()
		if err := db.Ping(ctx); err == nil {
			dbStatus = 1
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	var b strings.Builder
	b.WriteString("# HELP jobops_app_uptime_seconds Seconds since the API process started.\n")
	b.WriteString("# TYPE jobops_app_uptime_seconds gauge\n")
	fmt.Fprintf(&b, "jobops_app_uptime_seconds %.0f\n", time.Since(r.startedAt).Seconds())

	b.WriteString("# HELP jobops_database_up Database connectivity status, 1 for up and 0 for down.\n")
	b.WriteString("# TYPE jobops_database_up gauge\n")
	fmt.Fprintf(&b, "jobops_database_up %d\n", dbStatus)

	b.WriteString("# HELP jobops_http_requests_total Total HTTP requests by method, route, and status.\n")
	b.WriteString("# TYPE jobops_http_requests_total counter\n")

	keys := make([]requestKey, 0, len(r.requests))
	for key := range r.requests {
		keys = append(keys, key)
	}
	sort.Slice(keys, func(i int, j int) bool {
		if keys[i].Route != keys[j].Route {
			return keys[i].Route < keys[j].Route
		}
		if keys[i].Method != keys[j].Method {
			return keys[i].Method < keys[j].Method
		}
		return keys[i].Status < keys[j].Status
	})

	for _, key := range keys {
		stats := r.requests[key]
		fmt.Fprintf(&b, "jobops_http_requests_total%s %d\n", requestLabels(key, ""), stats.Count)
	}

	b.WriteString("# HELP jobops_http_request_duration_seconds HTTP request duration by method, route, and status.\n")
	b.WriteString("# TYPE jobops_http_request_duration_seconds histogram\n")
	for _, key := range keys {
		stats := r.requests[key]
		for i, bucket := range r.durationBuckets {
			fmt.Fprintf(
				&b,
				"jobops_http_request_duration_seconds_bucket%s %d\n",
				requestLabels(key, strconv.FormatFloat(bucket, 'f', -1, 64)),
				stats.Histogram[i],
			)
		}
		fmt.Fprintf(&b, "jobops_http_request_duration_seconds_bucket%s %d\n", requestLabels(key, "+Inf"), stats.Count)
		fmt.Fprintf(&b, "jobops_http_request_duration_seconds_sum%s %.6f\n", requestLabels(key, ""), stats.Duration)
		fmt.Fprintf(&b, "jobops_http_request_duration_seconds_count%s %d\n", requestLabels(key, ""), stats.Count)
	}

	return b.String()
}

func NewMetricsHandler(registry *Registry, db *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Data(http.StatusOK, "text/plain; version=0.0.4; charset=utf-8", []byte(registry.Render(db)))
	}
}

func requestLabels(key requestKey, le string) string {
	labels := []string{
		`method="` + escapeLabelValue(key.Method) + `"`,
		`route="` + escapeLabelValue(key.Route) + `"`,
		`status="` + strconv.Itoa(key.Status) + `"`,
	}
	if le != "" {
		labels = append(labels, `le="`+escapeLabelValue(le)+`"`)
	}

	return "{" + strings.Join(labels, ",") + "}"
}

func escapeLabelValue(value string) string {
	value = strings.ReplaceAll(value, `\`, `\\`)
	value = strings.ReplaceAll(value, "\n", `\n`)
	value = strings.ReplaceAll(value, `"`, `\"`)
	return value
}

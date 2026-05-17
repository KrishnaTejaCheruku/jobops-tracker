package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type HealthHandler struct {
	DB *pgxpool.Pool
}

func NewHealthHandler(db *pgxpool.Pool) *HealthHandler {
	return &HealthHandler{
		DB: db,
	}
}

func (h *HealthHandler) HealthCheck(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	dbStatus := "ok"

	if err := h.DB.Ping(ctx); err != nil {
		dbStatus = "error"
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status":   "error",
			"service":  "jobops-tracker-api",
			"database": dbStatus,
			"error":    err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":   "ok",
		"service":  "jobops-tracker-api",
		"version":  "0.1.0",
		"database": dbStatus,
	})
}

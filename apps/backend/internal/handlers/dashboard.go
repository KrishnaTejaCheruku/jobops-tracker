package handlers

import (
	"net/http"

	"github.com/KrishnaTejaCheruku/jobops-tracker/apps/backend/internal/repository"
	"github.com/gin-gonic/gin"
)

type DashboardHandler struct {
	Repo *repository.DashboardRepository
}

func NewDashboardHandler(repo *repository.DashboardRepository) *DashboardHandler {
	return &DashboardHandler{Repo: repo}
}

func (h *DashboardHandler) GetAnalytics(c *gin.Context) {
	analytics, err := h.Repo.GetAnalytics(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, analytics)
}

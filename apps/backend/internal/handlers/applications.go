package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/KrishnaTejaCheruku/jobops-tracker/apps/backend/internal/models"
	"github.com/KrishnaTejaCheruku/jobops-tracker/apps/backend/internal/repository"
	"github.com/KrishnaTejaCheruku/jobops-tracker/apps/backend/internal/validation"
	"github.com/gin-gonic/gin"
)

type ApplicationHandler struct {
	Repo *repository.ApplicationRepository
}

func NewApplicationHandler(repo *repository.ApplicationRepository) *ApplicationHandler {
	return &ApplicationHandler{Repo: repo}
}

func (h *ApplicationHandler) ListApplications(c *gin.Context) {
	filters := models.ApplicationFilters{
		Search:   strings.TrimSpace(c.Query("search")),
		Status:   strings.TrimSpace(c.Query("status")),
		Priority: strings.TrimSpace(c.Query("priority")),
		Source:   strings.TrimSpace(c.Query("source")),
		WorkMode: strings.TrimSpace(c.Query("work_mode")),
	}

	if err := validation.ValidateApplicationFilters(filters); err != nil {
		respondValidationError(c, err)
		return
	}

	pagination := models.ApplicationPagination{
		Page:     parsePositiveInt(c.Query("page"), 1),
		PageSize: parsePositiveInt(c.Query("page_size"), 10),
	}

	sort := models.ApplicationSort{
		SortBy:    strings.TrimSpace(c.Query("sort_by")),
		SortOrder: strings.TrimSpace(c.Query("sort_order")),
	}

	applications, err := h.Repo.ListPaginated(c.Request.Context(), filters, pagination, sort)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, applications)
}

func (h *ApplicationHandler) GetApplication(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}

	application, err := h.Repo.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if application == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "application not found"})
		return
	}

	c.JSON(http.StatusOK, application)
}

func (h *ApplicationHandler) CreateApplication(c *gin.Context) {
	var req models.CreateApplicationRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid request body",
			"details": []validation.FieldError{
				{
					Field:   "body",
					Message: err.Error(),
				},
			},
		})
		return
	}

	if err := validation.ValidateCreateApplication(req); err != nil {
		respondValidationError(c, err)
		return
	}

	application, err := h.Repo.Create(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, application)
}

func (h *ApplicationHandler) UpdateApplication(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}

	var req models.UpdateApplicationRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid request body",
			"details": []validation.FieldError{
				{
					Field:   "body",
					Message: err.Error(),
				},
			},
		})
		return
	}

	if err := validation.ValidateUpdateApplication(req); err != nil {
		respondValidationError(c, err)
		return
	}

	application, err := h.Repo.Update(c.Request.Context(), id, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if application == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "application not found"})
		return
	}

	c.JSON(http.StatusOK, application)
}

func (h *ApplicationHandler) DeleteApplication(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}

	deleted, err := h.Repo.Delete(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if !deleted {
		c.JSON(http.StatusNotFound, gin.H{"error": "application not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"deleted": true})
}

func (h *ApplicationHandler) GetApplicationStatusHistory(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}

	application, err := h.Repo.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if application == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "application not found"})
		return
	}

	history, err := h.Repo.ListStatusHistory(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, history)
}

func respondValidationError(c *gin.Context, err error) {
	if validationErr, ok := validation.AsValidationError(err); ok {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "validation failed",
			"details": validationErr.Fields,
		})
		return
	}

	c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
}

func parseID(c *gin.Context) (int64, bool) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid application id"})
		return 0, false
	}

	return id, true
}

func parsePositiveInt(value string, fallback int) int {
	if strings.TrimSpace(value) == "" {
		return fallback
	}

	parsed, err := strconv.Atoi(value)
	if err != nil || parsed < 1 {
		return fallback
	}

	return parsed
}

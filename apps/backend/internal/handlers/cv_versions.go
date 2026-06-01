package handlers

import (
	"net/http"

	"github.com/KrishnaTejaCheruku/jobops-tracker/apps/backend/internal/models"
	"github.com/KrishnaTejaCheruku/jobops-tracker/apps/backend/internal/repository"
	"github.com/gin-gonic/gin"
)

type CVVersionHandler struct {
	Repo *repository.CVVersionRepository
}

func NewCVVersionHandler(repo *repository.CVVersionRepository) *CVVersionHandler {
	return &CVVersionHandler{Repo: repo}
}

func (h *CVVersionHandler) ListCVVersions(c *gin.Context) {
	userID, ok := requireCurrentUserID(c)
	if !ok {
		return
	}

	cvVersions, err := h.Repo.List(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, cvVersions)
}

func (h *CVVersionHandler) GetCVVersion(c *gin.Context) {
	userID, ok := requireCurrentUserID(c)
	if !ok {
		return
	}

	id, ok := parseID(c)
	if !ok {
		return
	}

	cvVersion, err := h.Repo.GetByID(c.Request.Context(), userID, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if cvVersion == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "cv version not found"})
		return
	}

	c.JSON(http.StatusOK, cvVersion)
}

func (h *CVVersionHandler) CreateCVVersion(c *gin.Context) {
	userID, ok := requireCurrentUserID(c)
	if !ok {
		return
	}

	var req models.CreateCVVersionRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	cvVersion, err := h.Repo.Create(c.Request.Context(), userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, cvVersion)
}

func (h *CVVersionHandler) UpdateCVVersion(c *gin.Context) {
	userID, ok := requireCurrentUserID(c)
	if !ok {
		return
	}

	id, ok := parseID(c)
	if !ok {
		return
	}

	var req models.UpdateCVVersionRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	cvVersion, err := h.Repo.Update(c.Request.Context(), userID, id, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if cvVersion == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "cv version not found"})
		return
	}

	c.JSON(http.StatusOK, cvVersion)
}

func (h *CVVersionHandler) DeleteCVVersion(c *gin.Context) {
	userID, ok := requireCurrentUserID(c)
	if !ok {
		return
	}

	id, ok := parseID(c)
	if !ok {
		return
	}

	deleted, err := h.Repo.Delete(c.Request.Context(), userID, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if !deleted {
		c.JSON(http.StatusNotFound, gin.H{"error": "cv version not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"deleted": true})
}

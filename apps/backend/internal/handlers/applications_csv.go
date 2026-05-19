package handlers

import (
	"encoding/csv"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/KrishnaTejaCheruku/jobops-tracker/apps/backend/internal/models"
	"github.com/KrishnaTejaCheruku/jobops-tracker/apps/backend/internal/validation"
	"github.com/gin-gonic/gin"
)

var applicationCSVHeaders = []string{
	"job_title",
	"company_name",
	"source",
	"job_url",
	"location",
	"work_mode",
	"status",
	"cv_version",
	"cv_version_id",
	"salary_range",
	"follow_up_date",
	"recruiter_name",
	"recruiter_email",
	"job_description",
	"priority",
	"notes",
	"applied_date",
}

func (h *ApplicationHandler) ExportApplicationsCSV(c *gin.Context) {
	applications, err := h.Repo.List(c.Request.Context(), models.ApplicationFilters{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	filename := fmt.Sprintf("jobops-applications-%s.csv", time.Now().Format("2006-01-02"))

	c.Header("Content-Type", "text/csv; charset=utf-8")
	c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))

	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()

	if err := writer.Write(applicationCSVHeaders); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	for _, application := range applications {
		row := []string{
			application.JobTitle,
			application.CompanyName,
			application.Source,
			application.JobURL,
			application.Location,
			application.WorkMode,
			application.Status,
			application.CVVersion,
			int64ToCSV(application.CVVersionID),
			application.SalaryRange,
			application.FollowUpDate,
			application.RecruiterName,
			application.RecruiterEmail,
			application.JobDescription,
			application.Priority,
			application.Notes,
			application.AppliedDate,
		}

		if err := writer.Write(row); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}
}

func (h *ApplicationHandler) ImportApplicationsCSV(c *gin.Context) {
	fileHeader, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "csv file is required in form field 'file'"})
		return
	}

	file, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	defer file.Close()

	reader := csv.NewReader(file)
	reader.TrimLeadingSpace = true
	reader.FieldsPerRecord = -1

	rows, err := reader.ReadAll()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("invalid csv: %v", err)})
		return
	}

	if len(rows) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "csv file is empty"})
		return
	}

	headerIndex := buildCSVHeaderIndex(rows[0])
	result := models.CSVImportResult{
		Errors: []string{},
	}

	for rowNumber, row := range rows[1:] {
		actualRowNumber := rowNumber + 2

		req, err := buildCreateApplicationRequestFromCSVRow(headerIndex, row)
		if err != nil {
			result.Failed++
			result.Errors = append(result.Errors, fmt.Sprintf("row %d: %s", actualRowNumber, err.Error()))
			continue
		}

		if strings.TrimSpace(req.JobTitle) == "" {
			result.Failed++
			result.Errors = append(result.Errors, fmt.Sprintf("row %d: job_title is required", actualRowNumber))
			continue
		}

		if strings.TrimSpace(req.CompanyName) == "" {
			result.Failed++
			result.Errors = append(result.Errors, fmt.Sprintf("row %d: company_name is required", actualRowNumber))
			continue
		}

		if err := validation.ValidateCreateApplication(req); err != nil {
			result.Failed++
			result.Errors = append(result.Errors, fmt.Sprintf("row %d: %s", actualRowNumber, err.Error()))
			continue
		}

		if _, err := h.Repo.Create(c.Request.Context(), req); err != nil {
			result.Failed++
			result.Errors = append(result.Errors, fmt.Sprintf("row %d: %s", actualRowNumber, err.Error()))
			continue
		}

		result.Imported++
	}

	c.JSON(http.StatusOK, result)
}

func buildCSVHeaderIndex(headers []string) map[string]int {
	index := make(map[string]int, len(headers))

	for position, header := range headers {
		normalized := normalizeCSVHeader(header)
		index[normalized] = position
	}

	return index
}

func buildCreateApplicationRequestFromCSVRow(headerIndex map[string]int, row []string) (models.CreateApplicationRequest, error) {
	cvVersionID, err := parseOptionalInt64(csvValue(headerIndex, row, "cv_version_id"))
	if err != nil {
		return models.CreateApplicationRequest{}, fmt.Errorf("invalid cv_version_id")
	}

	return models.CreateApplicationRequest{
		JobTitle:       csvValue(headerIndex, row, "job_title"),
		CompanyName:    csvValue(headerIndex, row, "company_name"),
		Source:         csvValue(headerIndex, row, "source"),
		JobURL:         csvValue(headerIndex, row, "job_url"),
		Location:       csvValue(headerIndex, row, "location"),
		WorkMode:       csvValue(headerIndex, row, "work_mode"),
		Status:         csvValue(headerIndex, row, "status"),
		CVVersion:      csvValue(headerIndex, row, "cv_version"),
		CVVersionID:    cvVersionID,
		SalaryRange:    csvValue(headerIndex, row, "salary_range"),
		FollowUpDate:   csvValue(headerIndex, row, "follow_up_date"),
		RecruiterName:  csvValue(headerIndex, row, "recruiter_name"),
		RecruiterEmail: csvValue(headerIndex, row, "recruiter_email"),
		JobDescription: csvValue(headerIndex, row, "job_description"),
		Priority:       csvValue(headerIndex, row, "priority"),
		Notes:          csvValue(headerIndex, row, "notes"),
		AppliedDate:    csvValue(headerIndex, row, "applied_date"),
	}, nil
}

func csvValue(headerIndex map[string]int, row []string, key string) string {
	position, ok := headerIndex[key]
	if !ok || position >= len(row) {
		return ""
	}

	return strings.TrimSpace(row[position])
}

func normalizeCSVHeader(header string) string {
	normalized := strings.TrimSpace(header)
	normalized = strings.TrimPrefix(normalized, "\ufeff")
	normalized = strings.ToLower(normalized)

	return normalized
}

func parseOptionalInt64(value string) (int64, error) {
	value = strings.TrimSpace(value)
	if value == "" {
		return 0, nil
	}

	parsed, err := strconv.ParseInt(value, 10, 64)
	if err != nil {
		return 0, err
	}

	return parsed, nil
}

func int64ToCSV(value int64) string {
	if value == 0 {
		return ""
	}

	return strconv.FormatInt(value, 10)
}

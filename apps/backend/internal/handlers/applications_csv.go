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
	userID, ok := requireCurrentUserID(c)
	if !ok {
		return
	}

	applications, err := h.Repo.List(c.Request.Context(), userID, models.ApplicationFilters{})
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
	userID, ok := requireCurrentUserID(c)
	if !ok {
		return
	}

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

		applyCSVImportDefaults(&req)

		if err := validation.ValidateCreateApplication(req); err != nil {
			result.Failed++
			result.Errors = append(result.Errors, fmt.Sprintf("row %d: %s", actualRowNumber, formatValidationErrorForCSV(err)))
			continue
		}

		existing, err := h.Repo.FindDuplicateForImport(c.Request.Context(), userID, req)
		if err != nil {
			result.Failed++
			result.Errors = append(result.Errors, fmt.Sprintf("row %d: duplicate lookup failed: %s", actualRowNumber, err.Error()))
			continue
		}

		if existing == nil {
			if _, err := h.Repo.Create(c.Request.Context(), userID, req); err != nil {
				result.Failed++
				result.Errors = append(result.Errors, fmt.Sprintf("row %d: %s", actualRowNumber, err.Error()))
				continue
			}

			result.Imported++
			continue
		}

		if csvRowMatchesExistingApplication(*existing, req) {
			result.Skipped++
			continue
		}

		updatedApplication, err := h.Repo.Update(
			c.Request.Context(),
			userID,
			existing.ID,
			createRequestToUpdateRequest(req),
		)
		if err != nil {
			result.Failed++
			result.Errors = append(result.Errors, fmt.Sprintf("row %d: update failed: %s", actualRowNumber, err.Error()))
			continue
		}

		if updatedApplication == nil {
			result.Failed++
			result.Errors = append(result.Errors, fmt.Sprintf("row %d: duplicate disappeared before update", actualRowNumber))
			continue
		}

		result.Updated++
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

func applyCSVImportDefaults(req *models.CreateApplicationRequest) {
	if strings.TrimSpace(req.Source) == "" {
		req.Source = "LinkedIn"
	}

	if strings.TrimSpace(req.Status) == "" {
		req.Status = "Saved"
	}

	if strings.TrimSpace(req.Priority) == "" {
		req.Priority = "Medium"
	}
}

func createRequestToUpdateRequest(req models.CreateApplicationRequest) models.UpdateApplicationRequest {
	return models.UpdateApplicationRequest{
		JobTitle:       req.JobTitle,
		CompanyName:    req.CompanyName,
		Source:         req.Source,
		JobURL:         req.JobURL,
		Location:       req.Location,
		WorkMode:       req.WorkMode,
		Status:         req.Status,
		CVVersion:      req.CVVersion,
		CVVersionID:    req.CVVersionID,
		SalaryRange:    req.SalaryRange,
		FollowUpDate:   req.FollowUpDate,
		RecruiterName:  req.RecruiterName,
		RecruiterEmail: req.RecruiterEmail,
		JobDescription: req.JobDescription,
		Priority:       req.Priority,
		Notes:          req.Notes,
		AppliedDate:    req.AppliedDate,
	}
}

func csvRowMatchesExistingApplication(existing models.Application, req models.CreateApplicationRequest) bool {
	return sameCSVText(existing.JobTitle, req.JobTitle) &&
		sameCSVText(existing.CompanyName, req.CompanyName) &&
		sameCSVText(existing.Source, req.Source) &&
		sameCSVText(existing.JobURL, req.JobURL) &&
		sameCSVText(existing.Location, req.Location) &&
		sameCSVText(existing.WorkMode, req.WorkMode) &&
		sameCSVText(existing.Status, req.Status) &&
		sameCSVText(existing.CVVersion, req.CVVersion) &&
		existing.CVVersionID == req.CVVersionID &&
		sameCSVText(existing.SalaryRange, req.SalaryRange) &&
		sameCSVText(existing.FollowUpDate, req.FollowUpDate) &&
		sameCSVText(existing.RecruiterName, req.RecruiterName) &&
		sameCSVText(existing.RecruiterEmail, req.RecruiterEmail) &&
		sameCSVText(existing.JobDescription, req.JobDescription) &&
		sameCSVText(existing.Priority, req.Priority) &&
		sameCSVText(existing.Notes, req.Notes) &&
		sameCSVText(existing.AppliedDate, req.AppliedDate)
}

func sameCSVText(left string, right string) bool {
	return strings.TrimSpace(left) == strings.TrimSpace(right)
}

func formatValidationErrorForCSV(err error) string {
	validationErr, ok := validation.AsValidationError(err)
	if !ok {
		return err.Error()
	}

	messages := make([]string, 0, len(validationErr.Fields))

	for _, field := range validationErr.Fields {
		messages = append(messages, fmt.Sprintf("%s: %s", field.Field, field.Message))
	}

	return strings.Join(messages, "; ")
}

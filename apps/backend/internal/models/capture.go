package models

type CaptureAnalyzeRequest struct {
	URL              string `json:"url"`
	Title            string `json:"title"`
	SelectedText     string `json:"selected_text"`
	DOMText          string `json:"dom_text"`
	ScreenshotBase64 string `json:"screenshot_base64"`
}

type CaptureConfidence struct {
	JobTitle    float64 `json:"job_title"`
	CompanyName float64 `json:"company_name"`
	Location    float64 `json:"location"`
}

type CaptureAnalyzeResponse struct {
	JobTitle    string            `json:"job_title"`
	CompanyName string            `json:"company_name"`
	Source      string            `json:"source"`
	JobURL      string            `json:"job_url"`
	Location    string            `json:"location"`
	WorkMode    string            `json:"work_mode"`
	Status      string            `json:"status"`
	Priority    string            `json:"priority"`
	SalaryRange string            `json:"salary_range"`
	Notes       string            `json:"notes"`
	Confidence  CaptureConfidence `json:"confidence"`
}

type CaptureOCRResponse struct {
	CaptureAnalyzeResponse
	RawText string `json:"raw_text"`
}

from pydantic import BaseModel
from fastapi import FastAPI

from app.extract import extract_capture_fields
from app.ocr import extract_screenshot_text
from app.ocr_policy import should_run_screenshot_ocr


class AnalyzeRequest(BaseModel):
    url: str = ""
    title: str = ""
    selected_text: str = ""
    dom_text: str = ""
    screenshot_base64: str = ""


app = FastAPI(title="JobOps Capture OCR", version="0.1.0")


@app.get("/health")
def health():
    return {"status": "ok", "service": "jobops-capture-ocr"}


@app.post("/analyze")
def analyze(request: AnalyzeRequest):
    ocr_text = ""
    if should_run_screenshot_ocr(
        selected_text=request.selected_text,
        dom_text=request.dom_text,
        title=request.title,
        screenshot_base64=request.screenshot_base64,
    ):
        ocr_text = extract_screenshot_text(request.screenshot_base64)

    return extract_capture_fields(
        url=request.url,
        title=request.title,
        selected_text=request.selected_text,
        dom_text=request.dom_text,
        ocr_text=ocr_text,
    )

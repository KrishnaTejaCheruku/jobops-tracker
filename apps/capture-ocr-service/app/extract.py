import re
from urllib.parse import urlparse


def extract_capture_fields(
    *,
    url: str,
    title: str,
    selected_text: str,
    dom_text: str,
    ocr_text: str,
) -> dict:
    raw_text = _combine_text(selected_text, dom_text, ocr_text, title, url)
    job_title, company_name, location = _extract_title_company_location(
        title=title,
        selected_text=selected_text,
        raw_text=raw_text,
    )

    return {
        "job_title": job_title,
        "company_name": company_name,
        "source": _detect_source(url),
        "job_url": (url or "").strip(),
        "location": location,
        "work_mode": _detect_work_mode(raw_text),
        "status": "Saved",
        "priority": "Medium",
        "salary_range": _extract_salary(raw_text),
        "notes": "Extracted from screenshot. Please review before saving.",
        "raw_text": raw_text,
        "confidence": {
            "job_title": 0.8 if job_title else 0.0,
            "company_name": 0.7 if company_name else 0.0,
            "location": 0.6 if location else 0.0,
        },
    }


def _combine_text(*parts: str) -> str:
    text = "\n".join(part.strip() for part in parts if part and part.strip())
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text[:50000]


def _detect_source(url: str) -> str:
    host = urlparse(url or "").hostname or ""
    host = host.lower()

    if "linkedin.com" in host:
        return "LinkedIn"
    if "indeed." in host:
        return "Other"
    if "stepstone." in host:
        return "Other"
    if "greenhouse.io" in host:
        return "Company Website"
    if "lever.co" in host:
        return "Company Website"
    if "workdayjobs.com" in host or "myworkdayjobs.com" in host:
        return "Company Website"
    if host:
        return "Company Website"
    return "Other"


def _detect_work_mode(raw_text: str) -> str:
    text = raw_text.lower()
    if "remote" in text:
        return "Remote"
    if "hybrid" in text:
        return "Hybrid"
    if "on-site" in text or "onsite" in text:
        return "On-site"
    return "Hybrid"


def _extract_title_company_location(*, title: str, selected_text: str, raw_text: str) -> tuple[str, str, str]:
    linkedin = re.search(
        r"^\s*(?P<company>.+?)\s+hiring\s+(?P<title>.+?)\s+in\s+(?P<location>.+?)(?:\s+\|\s+LinkedIn|$)",
        title or "",
        re.IGNORECASE,
    )
    if linkedin:
        return (
            _clean_field(linkedin.group("title")),
            _clean_field(linkedin.group("company")),
            _clean_field(linkedin.group("location")),
        )

    lines = [_clean_field(line) for line in raw_text.splitlines()]
    lines = [line for line in lines if line]
    first_lines = lines[:8]

    job_title = _first_job_like_line(first_lines)
    company_name = _first_company_like_line(first_lines, job_title)
    location = _first_location_like_line(first_lines + [title or "", selected_text or ""])

    if not job_title and title:
        job_title = _clean_field(re.split(r"\s+\|\s+| - ", title, maxsplit=1)[0])

    return job_title, company_name, location


def _first_job_like_line(lines: list[str]) -> str:
    keywords = (
        "engineer",
        "developer",
        "manager",
        "analyst",
        "architect",
        "consultant",
        "administrator",
        "specialist",
        "designer",
        "lead",
        "intern",
    )
    for line in lines:
        lower = line.lower()
        if any(keyword in lower for keyword in keywords) and len(line) <= 120:
            return line
    return lines[0] if lines else ""


def _first_company_like_line(lines: list[str], job_title: str) -> str:
    for line in lines:
        if line != job_title and 2 <= len(line) <= 80 and not _looks_like_location(line):
            return line
    return ""


def _first_location_like_line(lines: list[str]) -> str:
    for line in lines:
        match = re.search(
            r"([A-Z][A-Za-z.' -]+,\s*(?:Germany|Deutschland|Austria|Switzerland|Remote))",
            line,
        )
        if match:
            return _clean_field(match.group(1))
    for line in lines:
        if _looks_like_location(line):
            return line
    return ""


def _looks_like_location(value: str) -> bool:
    lower = value.lower()
    return any(token in lower for token in ("germany", "deutschland", "hamburg", "berlin", "munich", "remote"))


def _extract_salary(raw_text: str) -> str:
    match = re.search(r"((?:€|EUR)\s?[0-9][0-9.,kK -]+)", raw_text)
    return _clean_field(match.group(1)) if match else ""


def _clean_field(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip(" -|,\n\t")

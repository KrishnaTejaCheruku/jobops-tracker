def should_run_screenshot_ocr(
    *,
    selected_text: str = "",
    dom_text: str = "",
    title: str = "",
    screenshot_base64: str = "",
) -> bool:
    visible_text = "\n".join(
        part.strip()
        for part in (selected_text, dom_text, title)
        if part and part.strip()
    )
    return bool(screenshot_base64) and len(visible_text) < 200

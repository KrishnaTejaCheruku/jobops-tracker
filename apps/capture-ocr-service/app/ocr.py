import base64
import io
from typing import Any

import numpy as np
from PIL import Image

_ocr_engine = None


def extract_screenshot_text(screenshot_base64: str) -> str:
    if not screenshot_base64:
        return ""

    try:
        image_bytes = _decode_data_url(screenshot_base64)
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        result = _get_ocr_engine().ocr(np.array(image), cls=True)
        return _flatten_ocr_text(result)
    except Exception:
        return ""


def _decode_data_url(value: str) -> bytes:
    raw = value.strip()
    if "," in raw and raw.lower().startswith("data:image/"):
        raw = raw.split(",", 1)[1]
    return base64.b64decode(raw, validate=False)


def _get_ocr_engine() -> Any:
    global _ocr_engine
    if _ocr_engine is None:
        from paddleocr import PaddleOCR

        _ocr_engine = PaddleOCR(use_angle_cls=True, lang="en", show_log=False)
    return _ocr_engine


def _flatten_ocr_text(result: Any) -> str:
    lines: list[str] = []

    def visit(node: Any) -> None:
        if isinstance(node, str):
            text = node.strip()
            if text:
                lines.append(text)
            return
        if isinstance(node, tuple) and len(node) >= 2 and isinstance(node[1], tuple):
            text = str(node[1][0]).strip()
            if text:
                lines.append(text)
            return
        if isinstance(node, list):
            for item in node:
                visit(item)

    visit(result)
    return "\n".join(lines)

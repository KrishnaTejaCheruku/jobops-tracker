import unittest

from app.ocr_policy import should_run_screenshot_ocr


class AnalyzeOCRDecisionTest(unittest.TestCase):
    def test_skips_screenshot_ocr_when_visible_text_is_available(self):
        should_run = should_run_screenshot_ocr(
            title="Research Scientist - Max Planck Institute Careers",
            dom_text="Research Scientist\nMax Planck Institute\nBerlin, Germany\nHybrid " * 4,
            screenshot_base64="data:image/png;base64,abc",
        )

        self.assertFalse(should_run)

    def test_runs_screenshot_ocr_when_visible_text_is_sparse(self):
        should_run = should_run_screenshot_ocr(
            title="",
            dom_text="",
            selected_text="",
            screenshot_base64="data:image/png;base64,abc",
        )

        self.assertTrue(should_run)


if __name__ == "__main__":
    unittest.main()

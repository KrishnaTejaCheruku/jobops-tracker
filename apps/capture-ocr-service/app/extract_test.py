import unittest

from app.extract import extract_capture_fields


class ExtractScienceJobTest(unittest.TestCase):
    def test_extracts_science_job_from_visible_text(self):
        payload = extract_capture_fields(
            url="https://jobs.example.edu/research-scientist",
            title="Research Scientist - Max Planck Institute Careers",
            selected_text="",
            dom_text="Research Scientist\nMax Planck Institute\nBerlin, Germany\nHybrid",
            ocr_text="",
        )

        self.assertEqual(payload["job_title"], "Research Scientist")
        self.assertEqual(payload["company_name"], "Max Planck Institute")
        self.assertEqual(payload["source"], "Company Website")
        self.assertEqual(payload["location"], "Berlin, Germany")
        self.assertEqual(payload["work_mode"], "Hybrid")


if __name__ == "__main__":
    unittest.main()

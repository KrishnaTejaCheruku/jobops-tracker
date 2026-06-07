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

    def test_ignores_linkedin_navigation_noise(self):
        payload = extract_capture_fields(
            url="https://www.linkedin.com/jobs/collections/recommended/?currentJobId=123",
            title="Top job picks for you | LinkedIn",
            selected_text="",
            dom_text="\n".join(
                [
                    "0 notifications total",
                    "Skip to search",
                    "Home",
                    "Jobs",
                    "DevOps Engineer",
                    "Example GmbH",
                    "Hamburg, Germany",
                    "Hybrid",
                ]
            ),
            ocr_text="",
        )

        self.assertEqual(payload["job_title"], "DevOps Engineer")
        self.assertEqual(payload["company_name"], "Example GmbH")
        self.assertEqual(payload["source"], "LinkedIn")
        self.assertEqual(payload["location"], "Hamburg, Germany")


if __name__ == "__main__":
    unittest.main()

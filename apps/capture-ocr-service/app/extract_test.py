import unittest

from app.extract import _detect_source, _first_location_like_line, extract_capture_fields


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


class SourceDetectionSecurityTest(unittest.TestCase):
    def test_detects_exact_and_subdomain_job_board_hosts(self):
        cases = {
            "https://linkedin.com/jobs/view/1": "LinkedIn",
            "https://www.linkedin.com/jobs/view/1": "LinkedIn",
            "https://greenhouse.io/jobs/1": "Company Website",
            "https://boards.greenhouse.io/company/jobs/1": "Company Website",
            "https://workdayjobs.com/company/job/1": "Company Website",
            "https://company.workdayjobs.com/job/1": "Company Website",
            "https://myworkdayjobs.com/company/job/1": "Company Website",
            "https://company.myworkdayjobs.com/job/1": "Company Website",
            "https://jobs.lever.co/company/1": "Company Website",
            "https://www.indeed.com/viewjob?jk=1": "Other",
            "https://de.indeed.com/viewjob?jk=1": "Other",
            "https://www.stepstone.de/stellenangebote": "Other",
        }

        for url, expected_source in cases.items():
            with self.subTest(url=url):
                self.assertEqual(_detect_source(url), expected_source)

    def test_rejects_attacker_controlled_lookalike_hosts(self):
        cases = [
            "https://evilgreenhouse.io/jobs/1",
            "https://greenhouse.io.attacker.example/jobs/1",
            "https://attacker-greenhouse.io/jobs/1",
            "https://evilworkdayjobs.com/job/1",
            "https://workdayjobs.com.attacker.example/job/1",
            "https://attacker-workdayjobs.com/job/1",
            "https://notmyworkdayjobs.com/job/1",
            "https://myworkdayjobs.com.attacker.example/job/1",
            "https://attacker-myworkdayjobs.com/job/1",
            "https://evillinkedin.com/jobs/1",
            "https://linkedin.com.attacker.example/jobs/1",
        ]

        for url in cases:
            with self.subTest(url=url):
                self.assertEqual(_detect_source(url), "Company Website")

    def test_normalizes_uppercase_ports_and_trailing_dot_hosts(self):
        self.assertEqual(
            _detect_source("https://BOARDS.GREENHOUSE.IO.:443/company/jobs/1"),
            "Company Website",
        )
        self.assertEqual(
            _detect_source("https://WWW.LINKEDIN.COM.:443/jobs/view/1"),
            "LinkedIn",
        )

    def test_malformed_or_hostless_url_returns_fallback(self):
        self.assertEqual(_detect_source(""), "Other")
        self.assertEqual(_detect_source("not a url"), "Other")
        self.assertEqual(_detect_source("http://[::1"), "Other")


class LocationExtractionSecurityTest(unittest.TestCase):
    def test_extracts_allowed_locations_with_bounded_parser(self):
        cases = {
            "Hamburg, Germany": "Hamburg, Germany",
            "Berlin, Deutschland": "Berlin, Deutschland",
            "Vienna, Austria": "Vienna, Austria",
            "Zurich, Switzerland": "Zurich, Switzerland",
            "Remote": "Remote",
            "St. John's-West, Germany": "St. John's-West, Germany",
        }

        for line, expected_location in cases.items():
            with self.subTest(line=line):
                self.assertEqual(_first_location_like_line([line]), expected_location)

    def test_ignores_malformed_location_lines(self):
        cases = [
            "Hamburg Germany",
            "Hamburg, Atlantis",
            "Hamburg, Germany, Extra",
            "Bad <script>, Germany",
            "",
        ]

        for line in cases:
            with self.subTest(line=line):
                self.assertEqual(_first_location_like_line([line]), "")

    def test_ignores_extremely_long_location_lines(self):
        self.assertEqual(_first_location_like_line(["A" * 10000 + ", Germany"]), "")
        self.assertEqual(_first_location_like_line(["A" * 20000]), "")

    def test_repeated_input_does_not_change_extraction_behavior(self):
        lines = ["A" * 350 for _ in range(1000)]
        lines.append("Berlin, Germany")

        self.assertEqual(_first_location_like_line(lines), "")


if __name__ == "__main__":
    unittest.main()

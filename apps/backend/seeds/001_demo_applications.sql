TRUNCATE TABLE applications RESTART IDENTITY;

INSERT INTO applications (
    job_title,
    company_name,
    source,
    job_url,
    location,
    work_mode,
    status,
    cv_version,
    notes,
    applied_date
)
VALUES
(
    'DevOps Engineer',
    'Example GmbH',
    'LinkedIn',
    'https://linkedin.com/jobs/example-devops',
    'Germany',
    'Hybrid',
    'Applied',
    'cv_kubernetes_v1',
    'Demo application created for local development.',
    '2026-05-17'
),
(
    'Cloud Engineer',
    'Demo Cloud AG',
    'LinkedIn',
    'https://linkedin.com/jobs/example-cloud',
    'Remote',
    'Remote',
    'Saved',
    'cv_cloud_terraform_v1',
    'Demo saved application for testing dashboard data.',
    '2026-05-17'
),
(
    'Platform Engineer',
    'Sample Platform GmbH',
    'Company Website',
    'https://example.com/careers/platform-engineer',
    'Berlin, Germany',
    'On-site',
    'Interview Scheduled',
    'cv_platform_engineering_v1',
    'Demo interview-stage application.',
    '2026-05-17'
);

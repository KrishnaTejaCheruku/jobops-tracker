TRUNCATE TABLE application_status_history, applications, cv_versions RESTART IDENTITY CASCADE;

INSERT INTO cv_versions (
    name,
    focus_area,
    file_path,
    notes
)
VALUES
(
    'cv_kubernetes_v1',
    'Kubernetes / Helm / Linux',
    '',
    'Demo CV version focused on Kubernetes, Helm, Linux operations, and container platforms.'
),
(
    'cv_cloud_terraform_v1',
    'Cloud / Terraform / AWS',
    '',
    'Demo CV version focused on cloud infrastructure, Terraform, AWS-style services, and automation.'
),
(
    'cv_platform_engineering_v1',
    'Platform Engineering / Observability',
    '',
    'Demo CV version focused on platform engineering, observability, developer experience, and CI/CD.'
);

INSERT INTO applications (
    job_title,
    company_name,
    source,
    job_url,
    location,
    work_mode,
    status,
    cv_version,
    cv_version_id,
    salary_range,
    follow_up_date,
    recruiter_name,
    recruiter_email,
    job_description,
    priority,
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
    1,
    '€60k-€75k',
    '2026-05-24',
    'Demo Recruiter',
    'recruiter@example.com',
    'Demo job description focused on Kubernetes, Docker, Terraform, Ansible, CI/CD, and Linux operations.',
    'High',
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
    2,
    'Not listed',
    NULL,
    '',
    '',
    'Demo cloud role focused on AWS, Terraform, monitoring, and automation.',
    'Medium',
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
    3,
    '€70k-€85k',
    '2026-05-20',
    'Platform Hiring Team',
    'hiring@example.com',
    'Demo platform engineering role focused on Kubernetes, Helm, observability, and developer platforms.',
    'High',
    'Demo interview-stage application.',
    '2026-05-17'
);

INSERT INTO application_status_history (
    application_id,
    old_status,
    new_status,
    note
)
SELECT
    id,
    '',
    status,
    'Seeded demo application'
FROM applications;

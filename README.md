# JobOps Tracker

JobOps Tracker is an open-source, self-hosted job application tracking platform for DevOps engineers and cloud professionals.

Live site:

```text
https://jobops.me
https://www.jobops.me
```

It replaces manual Excel-based job tracking with a modern application dashboard for job applications, CV versions, follow-ups, interviews, and job-search analytics.

## Why this project exists

Tracking job applications manually in spreadsheets becomes messy quickly. JobOps Tracker provides a structured, self-hosted alternative that can run locally using Docker and later on Kubernetes.

The project is also designed as a cloud-native DevOps portfolio project using:

- Docker
- Kubernetes
- Helm
- Terraform
- Ansible
- PostgreSQL
- Go
- React
- Caddy

## MVP Features

- Add job applications
- Track application status
- Track company and job title
- Store job source and URL
- Track CV version used
- Add notes
- View dashboard statistics
- Run locally with Docker Compose

## Planned Features

- CSV import
- CV file upload
- Follow-up reminders
- Floci S3/SQS integration
- Kubernetes deployment with Helm
- Terraform-based infrastructure
- Ansible VM setup
- CI/CD pipeline
- Monitoring with Prometheus, Grafana, and Loki

## Project Status

Production deployment is live at `https://jobops.me` and `https://www.jobops.me` with HTTPS, HTTP-to-HTTPS redirects, HSTS, passwordless OTP authentication, user-scoped application data, CSV import/export, analytics, Docker Compose deployment, Caddy reverse proxy, and PostgreSQL backups.

## License

MIT License.

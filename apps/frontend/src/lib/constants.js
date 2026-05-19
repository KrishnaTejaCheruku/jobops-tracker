export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const STATUS_OPTIONS = [
  "Saved",
  "Applied",
  "Recruiter Contacted",
  "Interview Scheduled",
  "Technical Interview",
  "Offer",
  "Rejected",
  "Ghosted",
  "Withdrawn",
];

export const PRIORITY_OPTIONS = ["Low", "Medium", "High"];

export const SOURCE_OPTIONS = [
  "LinkedIn",
  "Company Website",
  "Recruiter",
  "Referral",
  "Other",
];

export const WORK_MODE_OPTIONS = ["Remote", "Hybrid", "On-site"];

export const CLOSED_STATUSES = ["Offer", "Rejected", "Withdrawn"];

export const EMPTY_APPLICATION_FORM = {
  job_title: "",
  company_name: "",
  source: "LinkedIn",
  job_url: "",
  location: "",
  work_mode: "Hybrid",
  status: "Saved",
  cv_version: "",
  cv_version_id: 0,
  salary_range: "",
  follow_up_date: "",
  recruiter_name: "",
  recruiter_email: "",
  job_description: "",
  priority: "Medium",
  notes: "",
  applied_date: "",
};

export const EMPTY_FILTERS = {
  search: "",
  status: "All",
  priority: "All",
  source: "All",
  work_mode: "All",
};

export const EMPTY_CV_VERSION_FORM = {
  name: "",
  focus_area: "",
  file_path: "",
  notes: "",
};

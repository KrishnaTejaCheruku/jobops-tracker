import { ACTIVE_STATUSES } from "./constants";

export function getDateOnly(value) {
  if (!value) return null;

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
}

export function getToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export function isActiveApplication(application) {
  return ACTIVE_STATUSES.includes(application.status);
}

export function getFollowUpState(application) {
  if (!application.follow_up_date || !isActiveApplication(application)) {
    return "none";
  }

  const followUpDate = getDateOnly(application.follow_up_date);
  const today = getToday();

  if (!followUpDate) return "none";
  if (followUpDate < today) return "overdue";
  if (followUpDate.getTime() === today.getTime()) return "today";

  return "upcoming";
}

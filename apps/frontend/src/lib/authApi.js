const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");

function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return {};
}

async function request(path, options = {}) {
  const response = await fetch(apiUrl(path), {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    const message = data?.error || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
}

export async function requestOTP(email) {
  return request("/auth/request-otp", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function verifyOTP(email, otp) {
  return request("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ email, otp }),
  });
}

export async function getCurrentUser() {
  return request("/auth/me", {
    method: "GET",
  });
}

export async function updateProfile(displayName) {
  return request("/auth/profile", {
    method: "PATCH",
    body: JSON.stringify({ display_name: displayName }),
  });
}

export async function logoutUser() {
  return request("/auth/logout", {
    method: "POST",
  });
}

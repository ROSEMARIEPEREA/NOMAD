const BASE = "/api";

function getToken() {
  return localStorage.getItem("nomad_token");
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  signup: (payload) => request("/auth/signup", { method: "POST", body: payload, auth: false }),
  verifyOtp: (payload) => request("/auth/verify-otp", { method: "POST", body: payload, auth: false }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload, auth: false }),
  forgotPassword: (payload) => request("/auth/forgot-password", { method: "POST", body: payload, auth: false }),
  resetPassword: (payload) => request("/auth/reset-password", { method: "POST", body: payload, auth: false }),

  myschedule: () => request("/schedules/mine"),
  teamSchedule: () => request("/schedules/team"),
  createSchedule: (payload) => request("/schedules", { method: "POST", body: payload }),
  recommendMeeting: (payload) => request("/schedules/recommend", { method: "POST", body: payload }),
  bookMeeting: (payload) => request("/schedules/book-meeting", { method: "POST", body: payload }),
  deleteSchedule: (id) => request(`/schedules/${id}`, { method: "DELETE" }),

  listCards: () => request("/board"),
  progressSummary: () => request("/board/progress"),
  createCard: (payload) => request("/board", { method: "POST", body: payload }),
  editCard: (id, payload) => request(`/board/${id}`, { method: "PATCH", body: payload }),
  moveCard: (id, status_column) => request(`/board/${id}/move`, { method: "PATCH", body: { status_column } }),
  deleteCard: (id) => request(`/board/${id}`, { method: "DELETE" }),

  listContacts: () => request("/messages/contacts"),
  directHistory: (userId) => request(`/messages/direct/${userId}`),
  groupHistory: (groupId) => request(`/messages/group/${groupId}`),
  listGroups: () => request("/messages/groups"),
  createGroup: (payload) => request("/messages/groups", { method: "POST", body: payload }),

  listNotifications: () => request("/notifications"),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: "PATCH" }),
};

export { getToken };

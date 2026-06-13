/**
 * CampusIQ X - API Service Layer
 * -----------------------------------
 * Centralized fetch wrappers for the FastAPI backend. All components
 * call through this module so the API base URL and error handling
 * stay consistent (Single Responsibility / DRY).
 *
 * In development, Vite proxies "/api" -> http://localhost:8000
 * (see vite.config.js). In production, set VITE_API_BASE_URL to the
 * deployed backend URL.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const errorBody = await response.json();
      detail = errorBody.detail || detail;
    } catch {
      /* ignore parse errors */
    }
    throw new Error(detail);
  }

  return response.json();
}

export const api = {
  // Students
  getStudents: () => request("/students"),
  getStudent: (studentId) => request(`/student/${studentId}`),

  // Dashboard & Analytics
  getDashboard: () => request("/dashboard"),
  getAnalytics: () => request("/analytics"),

  // AI Chat (CampusCopilotAgent orchestration)
  sendChatMessage: (studentId, message) =>
    request("/chat", {
      method: "POST",
      body: JSON.stringify({ student_id: studentId, message }),
    }),

  // Study Planner
  generateStudyPlan: (studentId, payload = {}) =>
    request("/studyplan", {
      method: "POST",
      body: JSON.stringify({ student_id: studentId, ...payload }),
    }),

  // Resume Review
  uploadResume: (studentId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    return fetch(`${API_BASE}/resume/upload?student_id=${encodeURIComponent(studentId)}`, {
      method: "POST",
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || res.statusText);
      }
      return res.json();
    });
  },

  // Placement Readiness
  predictPlacement: (studentId, targetCompanies = null) =>
    request("/placement/predict", {
      method: "POST",
      body: JSON.stringify({ student_id: studentId, target_companies: targetCompanies }),
    }),

  // Interview Coach
  getInterviewQuestions: (studentId, role = "Software Engineer", difficulty = "Intermediate") =>
    request("/interview/questions", {
      method: "POST",
      body: JSON.stringify({ student_id: studentId, role, difficulty }),
    }),
};

export default api;

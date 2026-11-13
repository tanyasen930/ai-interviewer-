import axios from "axios";
import mockAdapter from "./mock";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
});
// Backend ke bina testing: client/.env mein VITE_USE_MOCK=true
if (import.meta.env.VITE_USE_MOCK === "true") {
  api.defaults.adapter = mockAdapter;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Token expire ya invalid ho to login par bhejo
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || "";
    const isAuthCall = url.includes("/api/auth/login") || url.includes("/api/auth/register");
    if (err.response?.status === 401 && !isAuthCall) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// Backend ke error ko readable message mein badalta hai
export const errMsg = (err, fallback = "Something went wrong. Please try again.") => {
  const d = err?.response?.data;
  if (!d) {
    return err?.message === "Network Error"
      ? "Cannot reach the server. Please make sure the backend is running."
      : fallback;
  }
  if (d.message && d.error) return `${d.message}: ${d.error}`;
  return d.message || d.error || fallback;
};

export default api;
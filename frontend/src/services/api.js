import axios from "axios";

const normalizeApiUrl = (url) => {
  const baseUrl = (url || "http://localhost:4000/api").replace(/\/$/, "");
  return baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;
};

const api = axios.create({
  baseURL: normalizeApiUrl(import.meta.env.VITE_API_URL)
});

const clearStoredSession = () => {
  localStorage.removeItem("erp_token");
  localStorage.removeItem("erp_user");
  localStorage.removeItem("erp_company");
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("erp_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearStoredSession();
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }
    if (error.response?.status === 403 && !["/login", "/unauthorized"].includes(window.location.pathname)) {
      window.location.assign("/unauthorized");
    }
    return Promise.reject(error);
  }
);

export default api;

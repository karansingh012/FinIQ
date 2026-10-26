import axios from "axios";
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api/v1",
  timeout: 15000,
});
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("finiq-token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (r) => r,
  (e) => {
    if (e.response?.status === 401 && !e.config?.url?.includes("/auth/")) {
      sessionStorage.removeItem("finiq-token");
      window.dispatchEvent(new Event("finiq-expired"));
    }
    return Promise.reject(e);
  },
);
export const errorMessage = (e) =>
  e.response?.data?.message || "Something went wrong. Please try again.";

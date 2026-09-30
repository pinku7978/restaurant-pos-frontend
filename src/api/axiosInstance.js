import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api"
});

// Attach the token from localStorage to every outgoing request automatically,
// so individual pages never have to remember to do it themselves.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    config.headers["x-client-url"] = window.location.origin;
  }
  return config;
});

export default api;

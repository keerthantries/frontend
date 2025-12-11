
import axios from "axios";

/**
 * In Vite, env variables must be prefixed with VITE_.
 * Define it in .env files (see below).
 */

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
console.log("HTTP baseURL:", baseURL);

const httpClient = axios.create({
  baseURL,
  timeout: 20000, // 20s timeout—adjust as needed
  withCredentials: false, // set true if you use cookies/sessions
});

// Request interceptor: attach Bearer token if available
httpClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("vp_token"); // your chosen key
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401, API errors, etc.
httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response } = error;

    // Network error or timeout
    if (!response) {
      // Optional: log or show toast
      return Promise.reject(error);
    }

    // Unauthorized: clear token & redirect to login (optional)
    if (response.status === 401) {
      localStorage.removeItem("vp_token");
      // e.g., window.location.href = "/login";
    }

    // Uniform error shape
    return Promise.reject({
      status: response.status,
      message:
        response.data?.message ||
        response.data?.error ||
        response.statusText ||
        "Request failed",
      data: response.data,
    });
  }
);

export default httpClient;

import axios from "axios";
import { clearToken, getToken, loginUrl } from "@/lib/auth";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // A wrong password on the login page is also a 401: show its message
    // there instead of reloading the page.
    const isLoginCall = String(error.config?.url || "").includes("/auth/admin/login");
    if (
      typeof window !== "undefined" &&
      error.response?.status === 401 &&
      !isLoginCall &&
      !window.location.pathname.startsWith("/admin/login")
    ) {
      clearToken();

      // Come back to this page after logging in again.
      window.location.href = loginUrl();
    }

    return Promise.reject(error);
  }
);

export default api;

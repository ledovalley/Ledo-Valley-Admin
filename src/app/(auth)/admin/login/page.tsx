"use client";

import { useState } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { getErrorMessage } from "@/lib/getErrorMessage";

export default function AdminLoginPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = () => {
    if (!userId.trim()) {
      return "Admin ID is required";
    }
    if (!password.trim()) {
      return "Password is required";
    }
    if (password.length < 6) {
      return "Password must be at least 6 characters";
    }
    return null;
  };

  const handleLogin = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setError(null);
      setLoading(true);

      const res = await api.post("/auth/admin/login", {
        userId: userId.trim(),
        password,
      });

      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem("admin_token", res.data.token);

      router.push("/admin");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-(--color-bg-page)">
      <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-lg relative">
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/70 rounded-2xl flex items-center justify-center z-10">
            <div className="text-sm text-text-secondary">
              Signing you in…
            </div>
          </div>
        )}

        <h1 className="text-2xl font-playfair text-center mb-2">
          Admin Login
        </h1>

        <p className="text-center text-sm text-text-secondary mb-6">
          Restricted access only
        </p>

        {/* Error message */}
        {error && (
          <div className="mb-4 text-sm text-warning">
            {error}
          </div>
        )}

        {/* Admin ID */}
        <input
          placeholder="Admin ID"
          disabled={loading}
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          className="
            w-full mb-4 px-4 py-3 border rounded-full
            focus:outline-none focus:ring-2
            focus:ring-(--color-brand-primary)/30
            disabled:opacity-60 disabled:cursor-not-allowed
          "
        />

        {/* Password */}
        <div className="relative mb-4">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            disabled={loading}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="
              w-full px-4 py-3 border rounded-full pr-12
              focus:outline-none focus:ring-2
              focus:ring-(--color-brand-primary)/30
              disabled:opacity-60 disabled:cursor-not-allowed
            "
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="
              absolute right-4 top-1/2 -translate-y-1/2
              text-xs text-text-secondary
              hover:opacity-70
            "
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        {/* Remember me */}
        <div className="flex items-center gap-2 mb-6 text-sm">
          <input
            type="checkbox"
            id="remember"
            checked={rememberMe}
            disabled={loading}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="accent-(--color-brand-primary)"
          />
          <label
            htmlFor="remember"
            className="text-text-secondary"
          >
            Remember me
          </label>
        </div>

        {/* Submit */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="
            w-full py-3 rounded-full text-white font-medium
            bg-(--color-brand-primary)
            hover:opacity-90
            disabled:opacity-70 disabled:cursor-not-allowed
            transition
          "
        >
          Login
        </button>
      </div>
    </div>
  );
}

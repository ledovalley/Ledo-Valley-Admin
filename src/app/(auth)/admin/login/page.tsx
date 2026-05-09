"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock, ShieldAlert, User } from "lucide-react";
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
    if (!userId.trim()) return "Admin ID is required";
    if (!password.trim()) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
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
    <div className="min-h-screen bg-bg-page flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="relative overflow-hidden rounded-3xl border border-black/10 bg-bg-surface shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
          {loading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/75 backdrop-blur-sm">
              <div className="flex items-center gap-3 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />
                Signing you in...
              </div>
            </div>
          )}

          <div className="border-b border-black/5 bg-bg-dark px-6 pt-8 pb-6 sm:px-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-bg-page/60 text-(--color-brand-primary)">
              <ShieldAlert className="h-7 w-7" />
            </div>

            <h1 className="text-center text-2xl font-medium tracking-tight text-text-on-dark">
              Admin Login
            </h1>

            <p className="mt-2 text-center text-sm leading-6 text-text-on-dark/50">
              Sign in to access the admin dashboard. Restricted to authorized personnel only.
            </p>
          </div>

          <div className="px-6 py-6 sm:px-8 sm:py-8">
            {error && (
              <div
                role="alert"
                aria-live="polite"
                className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label
                  htmlFor="userId"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Admin ID
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="userId"
                    type="text"
                    autoComplete="username"
                    placeholder="Enter your admin ID"
                    disabled={loading}
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    className="
                      w-full rounded-2xl border border-black/10 bg-white
                      py-3 pl-11 pr-4 text-sm text-gray-900 placeholder:text-gray-400
                      outline-none transition
                      focus:border-(--color-brand-primary)/40
                      focus:ring-4 focus:ring-(--color-brand-primary)/10
                      disabled:cursor-not-allowed disabled:opacity-60
                    "
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>

                  <button
                    type="button"
                    className="text-xs font-medium text-(--color-brand-primary) hover:opacity-80"
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    disabled={loading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    className="
                      w-full rounded-2xl border border-black/10 bg-white
                      py-3 pl-11 pr-12 text-sm text-gray-900 placeholder:text-gray-400
                      outline-none transition
                      focus:border-(--color-brand-primary)/40
                      focus:ring-4 focus:ring-(--color-brand-primary)/10
                      disabled:cursor-not-allowed disabled:opacity-60
                    "
                  />

                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword(!showPassword)}
                    className="
                      absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2
                      items-center justify-center rounded-full text-gray-500
                      transition hover:bg-black/5 hover:text-gray-700
                    "
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <label
                  htmlFor="remember"
                  className="flex cursor-pointer items-center gap-2 text-sm text-gray-600"
                >
                  <input
                    id="remember"
                    type="checkbox"
                    checked={rememberMe}
                    disabled={loading}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-black/20 accent-(--color-brand-primary)"
                  />
                  <span>Remember me</span>
                </label>

                <span className="text-xs text-gray-400">Secure access</span>
              </div>

              <button
                onClick={handleLogin}
                disabled={loading}
                className="
                  mt-2 inline-flex w-full items-center justify-center rounded-2xl
                  bg-(--color-brand-primary) px-4 py-3 text-sm font-semibold text-white
                  shadow-sm transition hover:opacity-95
                  focus:outline-none focus:ring-4 focus:ring-(--color-brand-primary)/20
                  disabled:cursor-not-allowed disabled:opacity-70
                "
              >
                {loading ? "Signing in..." : "Login to Dashboard"}
              </button>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-gray-500">
          Protected system access. All login activity may be monitored.
        </p>
      </div>
    </div>
  );
}
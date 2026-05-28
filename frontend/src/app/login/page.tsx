"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Eye, EyeOff, Check, X } from "lucide-react";
import toast from "react-hot-toast";
import { api, isAuthenticated } from "@/lib/api";
import { AuthShowcase } from "@/components/auth/AuthShowcase";
import { cn } from "@/lib/utils";
import "./auth.css";

type FieldState = "idle" | "valid" | "invalid";

function StatusIcon({ state }: { state: FieldState }) {
  if (state === "idle") return null;
  if (state === "valid") return <Check size={16} className="auth-status-valid" strokeWidth={2.5} />;
  return <X size={16} className="auth-status-invalid" strokeWidth={2.5} />;
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("auth-active");
    return () => document.documentElement.classList.remove("auth-active");
  }, []);

  useEffect(() => {
    if (isAuthenticated()) router.replace("/dashboard");
  }, [router]);

  const emailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), [email]);
  const passwordValid = password.length >= 8;

  const fieldState = (value: string, valid: boolean): FieldState =>
    value.length === 0 ? "idle" : valid ? "valid" : "invalid";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Enter email and password");
      return;
    }
    if (!emailValid) {
      toast.error("Enter a valid email");
      return;
    }
    if (!passwordValid) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      if (mode === "register") {
        await api.auth.register(email, password);
        toast.success("Account created — logging in...");
      }
      await api.auth.login(email, password);
      toast.success("Welcome back!");
      router.push("/dashboard");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-root">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="auth-card"
      >
        <div className="auth-mobile-accent" aria-hidden>
          <div className="auth-mobile-accent-inner">
            <div className="auth-brand">
              <div className="auth-brand-dot" />
              <span className="auth-brand-name">AlgoTrader</span>
            </div>
            <span className="auth-mobile-tagline">Pro Trading</span>
          </div>
        </div>

        <div className="auth-showcase-panel">
          <AuthShowcase />
        </div>

        <div className="auth-form-panel">
          <div className="auth-form-inner">
            <h1 className="auth-heading">Welcome to AlgoTrader</h1>
            <p className="auth-subheading">
              {mode === "register"
                ? "Create your account and start trading with automated strategies."
                : "Sign in to access your dashboard, bots, and live market data."}
            </p>

            <div className="auth-tabs" role="tablist">
              <motion.div
                className="auth-tab-slider"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                animate={{ x: mode === "register" ? 0 : "100%" }}
              />
              <button
                type="button"
                role="tab"
                aria-selected={mode === "register"}
                onClick={() => setMode("register")}
                className={cn("auth-tab", mode === "register" && "auth-tab-active")}
              >
                Sign up
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "login"}
                onClick={() => setMode("login")}
                className={cn("auth-tab", mode === "login" && "auth-tab-active")}
              >
                Log in
              </button>
            </div>

            <AnimatePresence mode="wait">
              <motion.form
                key={mode}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22 }}
                onSubmit={handleSubmit}
                className="flex-1"
              >
                <div className="auth-field">
                  <label className="auth-label" htmlFor="email">
                    Email
                  </label>
                  <div className="auth-input-wrap">
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="auth-input"
                      placeholder="name@email.com"
                      autoComplete="email"
                    />
                    <div className="auth-input-actions">
                      <StatusIcon state={fieldState(email, emailValid)} />
                    </div>
                  </div>
                </div>

                <div className="auth-field">
                  <label className="auth-label" htmlFor="password">
                    Password
                  </label>
                  <div className="auth-input-wrap">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="auth-input auth-input--actions"
                      placeholder="Min. 8 characters"
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                    />
                    <div className="auth-input-actions">
                      <StatusIcon state={fieldState(password, passwordValid)} />
                      <button
                        type="button"
                        className="auth-icon-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="auth-btn-primary">
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin mr-2" />
                      Please wait…
                    </>
                  ) : mode === "register" ? (
                    "Sign up"
                  ) : (
                    "Log in"
                  )}
                </button>
              </motion.form>
            </AnimatePresence>

            <p className="auth-footer">
              {mode === "register" ? (
                <>
                  Already have an account?{" "}
                  <button type="button" className="auth-footer-link" onClick={() => setMode("login")}>
                    Log in
                  </button>
                </>
              ) : (
                <>
                  Don&apos;t have an account?{" "}
                  <button type="button" className="auth-footer-link" onClick={() => setMode("register")}>
                    Sign up
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

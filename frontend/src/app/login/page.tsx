"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Zap, Loader2, Mail, Lock } from "lucide-react";
import toast from "react-hot-toast";
import { api, isAuthenticated } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) router.replace("/dashboard");
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Enter email and password");
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
    <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-brand flex items-center justify-center mx-auto mb-4">
            <Zap size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">AlgoTrader Pro</h1>
          <p className="text-text-secondary text-sm mt-1">
            {mode === "login" ? "Sign in to your trading dashboard" : "Create a new account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card-elevated p-6 space-y-4">
          <div>
            <label className="text-xs text-text-secondary mb-1 block">Email</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-3 text-text-muted" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field pl-9"
                placeholder="trader@example.com"
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-text-secondary mb-1 block">Password</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-3 text-text-muted" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-9"
                placeholder="••••••••"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Please wait...</>
            ) : (
              mode === "login" ? "Sign In" : "Create Account"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-text-muted mt-4">
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="text-brand hover:underline font-medium"
          >
            {mode === "login" ? "Register" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}

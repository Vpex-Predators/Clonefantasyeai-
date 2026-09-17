import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Radar, Loader2, LogOut } from "lucide-react";
import GoogleIcon from "@/components/GoogleIcon";
import { safeReturnTo } from "@/lib/authReturnTo";

export default function FloatingAuthCard() {
  const { user, isAuthenticated, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const returnTo = safeReturnTo();

  // Signed in — collapse into a compact profile chip.
  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-sm font-bold text-emerald-300">
          {(user.full_name || user.email || "?").charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{user.full_name || "Commander"}</p>
          <p className="truncate text-[11px] text-white/45">{user.email}</p>
        </div>
        <button onClick={() => logout()} className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-white/50 hover:text-white">
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </button>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = returnTo;
    } catch (err) {
      setError(err.message || "Invalid email or password");
      setLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-2xl shadow-black/50 backdrop-blur-xl">
      <div className="pointer-events-none absolute -top-16 right-0 h-40 w-40 rounded-full bg-emerald-400/15 blur-3xl" />
      <div className="relative flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400 text-slate-950">
          <Radar className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-heading text-lg font-bold leading-tight text-white">
            FantasyEdge <span className="text-emerald-400">AI</span>
          </h1>
          <p className="text-[11px] text-white/50">Sign in to unlock your tactical briefing</p>
        </div>
      </div>

      <button
        onClick={() => base44.auth.loginWithProvider("google", returnTo)}
        className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 text-sm font-semibold text-white hover:bg-white/10"
      >
        <GoogleIcon className="h-4 w-4" /> Continue with Google
      </button>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
        <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
          <span className="bg-slate-900 px-3 text-white/40">or</span>
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-lg border border-rose-400/30 bg-rose-400/10 p-2.5 text-xs text-rose-300">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-2.5">
        <input
          type="email" required autoComplete="email" placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 text-sm text-white placeholder-white/35 outline-none focus:border-emerald-400/60"
        />
        <input
          type="password" required autoComplete="current-password" placeholder="Password" value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 text-sm text-white placeholder-white/35 outline-none focus:border-emerald-400/60"
        />
        <button
          type="submit" disabled={loading}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 text-sm font-bold text-slate-950 hover:bg-emerald-300 disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />} Enter command center
        </button>
      </form>

      <div className="mt-3 flex justify-between text-[11px] text-white/45">
        <Link to="/register" className="hover:text-emerald-300">Create account</Link>
        <Link to="/forgot-password" className="hover:text-emerald-300">Forgot password?</Link>
      </div>
    </div>
  );
}
const fs = require("fs");

const d = "div";
const h2 = "h2";
const p = "p";

const content = `"use client";

import { useState } from "react";
import { Lock, User } from "lucide-react";
import { supabase } from "@/lib/supabase";

type LoginModalProps = {
  open: boolean;
};

export function LoginModal({ open }: LoginModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleGoogleSignIn() {
    setLoading(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
      }
    } catch {
      setError("Unable to start Google sign-in. Please try again.");
      setLoading(false);
    }
  }

  return (
    <${d}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
    >
      <${d} className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900/60 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <${d} className="mb-6 flex flex-col items-center text-center">
          <${d} className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10">
            <Lock className="h-7 w-7 text-emerald-400" aria-hidden />
          </${d}>
          <${h2}
            id="login-modal-title"
            className="text-xl font-bold tracking-tight text-slate-50"
          >
            Sign in to PoolPay
          </${h2}>
          <${p} className="mt-2 text-sm leading-relaxed text-slate-400">
            Wallet and Activity are protected. Continue with Google to access
            your trusted circle.
          </${p}>
        </${d}>

        <button
          type="button"
          onClick={() => void handleGoogleSignIn()}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-400 px-6 py-4 text-base font-bold text-slate-950 shadow-[0_0_24px_rgba(52,211,153,0.35)] transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
        >
          <User className="h-5 w-5 shrink-0" aria-hidden />
          {loading ? "Redirecting..." : "Continue with Google"}
        </button>

        {error && (
          <${p} className="mt-4 text-center text-xs text-red-400" role="alert">
            {error}
          </${p}>
        )}
      </${d}>
    </${d}>
  );
}
`;

fs.writeFileSync(
  "C:/Users/hkathuria/Downloads/poolpay/components/LoginModal.tsx",
  content
);

"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { inputClass } from "@/components/ui/primitives";
import { ArrowLeft, Lock, LogIn } from "lucide-react";

export default function AdminLoginPage() {
  const { signIn } = useApp();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: signInError, role } = await signIn(email.trim(), password);
    setLoading(false);

    if (signInError) {
      setError(signInError);
      return;
    }
    if (role !== "admin") {
      setError("You don't have admin access. Use the teacher portal to sign in.");
      return;
    }

    router.push("/admin");
  };

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6 py-16"
      style={{ background: "linear-gradient(160deg, #0a1f14 0%, #0d2419 60%, #060f0a 100%)" }}
    >
      {/* Back link */}
      <div className="absolute left-6 top-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-forest-300/50 transition-colors hover:text-forest-300/80"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Back to site
        </Link>
      </div>

      <div className="w-full max-w-sm">
        {/* Logo + heading */}
        <div className="mb-8 text-center">
          <Image
            src="/logo-home.png"
            alt="Biology Bloke Edventures"
            width={80}
            height={80}
            className="mx-auto h-14 w-auto opacity-90 drop-shadow-2xl"
          />
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-forest-700/40 bg-forest-900/60 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-widest text-forest-400">
            <Lock className="h-3 w-3" aria-hidden />
            Admin portal
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-8 backdrop-blur">
          <h2 className="display mb-1 text-xl font-bold text-cream">Sign in</h2>
          <p className="mb-6 text-sm text-forest-300/60">
            Restricted to Biology Bloke team members.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-forest-400">
                Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@biologybloke.com"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-cream placeholder-forest-600 outline-none transition focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20"
                disabled={loading}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-forest-400">
                Password
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-cream placeholder-forest-600 outline-none transition focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20"
                disabled={loading}
              />
            </div>

            {error && (
              <p className="rounded-xl bg-clay-400/10 px-4 py-3 text-xs font-medium text-clay-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-forest-600 px-4 py-2.5 text-sm font-semibold text-cream shadow-lg transition hover:bg-forest-500 disabled:opacity-50"
            >
              <LogIn className="h-4 w-4" aria-hidden />
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-forest-700/60">
          Teacher?{" "}
          <Link href="/login" className="text-forest-500/80 hover:text-forest-400 hover:underline">
            Use the teacher portal
          </Link>
        </p>
      </div>
    </div>
  );
}

"use client";
import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/lib/store";
import { Button, inputClass } from "@/components/ui/primitives";
import { roleHome } from "@/components/layout/navConfig";
import { LogIn, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const { signIn } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(
    searchParams.get("error") === "admin_only"
      ? "Admin access is restricted. Please sign in with an authorised account."
      : ""
  );
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
    router.push(role ? roleHome[role] : "/teacher");
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel: branding */}
      <div
        className="hidden flex-col items-center justify-between px-12 py-12 lg:flex lg:w-[45%]"
        style={{ background: "linear-gradient(160deg, #204535 0%, #2c5844 55%, #163329 100%)" }}
      >
        <div />
        <div className="text-center">
          <Image
            src="/edventra-white.png"
            alt="Edventra"
            width={472}
            height={119}
            className="mx-auto h-auto w-4/5 max-w-xs drop-shadow-2xl"
          />
          <h1 className="display mt-6 text-3xl font-bold leading-tight text-cream">
            Bringing the wild<br />to every classroom.
          </h1>
          <p className="mt-3 text-base text-forest-100/70">
            Adaptive conservation education through short-form wildlife media.
          </p>
          <div className="mt-10 space-y-3 text-left">
            {[
              "Curriculum-aligned units for Stage 3-5",
              "Live class insights and adaptive tasks",
              "Students earn explorer points as they learn",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 text-sm text-forest-100/80">
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-forest-400" />
                {item}
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-forest-100/40">
          Edventra · Conservation education for Australian schools
        </p>
      </div>

      {/* Right panel: form */}
      <div className="flex flex-1 flex-col bg-cream px-6 py-12">
        {/* Back to home */}
        <div className="mb-auto w-full max-w-sm self-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-charcoal-soft hover:text-forest-900"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to home
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            {/* Mobile wordmark */}
            <div className="mb-8 flex justify-center lg:hidden">
              <span className="display text-2xl font-bold tracking-tight text-forest-900">Edventra</span>
            </div>

            <h2 className="display mb-1 text-2xl font-bold text-forest-900">Teacher sign in</h2>
            <p className="mb-7 text-sm text-charcoal-soft">
              Sign in to manage your classes and Edventures.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-forest-900">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@school.edu.au"
                  className={inputClass + " w-full"}
                  disabled={loading}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-forest-900">
                  Password
                </label>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className={inputClass + " w-full"}
                  disabled={loading}
                />
              </div>

              {error && (
                <p className="rounded-2xl bg-clay-400/10 px-4 py-3 text-sm font-medium text-clay-600">
                  {error}
                </p>
              )}

              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                <LogIn className="h-4 w-4" aria-hidden />
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            {/* Create account - more prominent */}
            <div className="mt-5 rounded-2xl border border-sand bg-white px-5 py-4 text-center">
              <p className="text-sm font-semibold text-forest-900">New to Edventra?</p>
              <p className="mt-0.5 text-xs text-charcoal-soft">Set up your school account and start running Edventures in minutes.</p>
              <Link
                href="/register"
                className="mt-3 inline-flex w-full items-center justify-center rounded-xl border-2 border-forest-700 px-4 py-2.5 text-sm font-semibold text-forest-700 transition-colors hover:bg-forest-700 hover:text-cream"
              >
                Create teacher account
              </Link>
            </div>

            <div className="mt-6 border-t border-sand pt-5 text-center">
              <p className="text-xs text-charcoal-soft">
                Student?{" "}
                <Link href="/" className="font-semibold text-forest-700 hover:underline">
                  Enter your class code on the home page
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-auto" />
      </div>
    </div>
  );
}

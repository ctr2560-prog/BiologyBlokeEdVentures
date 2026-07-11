"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { Button, inputClass } from "@/components/ui/primitives";
import { LogIn } from "lucide-react";

export default function LoginPage() {
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
    const { error: signInError } = await signIn(email.trim(), password);
    setLoading(false);
    if (signInError) {
      setError(signInError);
      return;
    }
    router.push("/teacher");
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel: branding */}
      <div
        className="hidden flex-col items-center justify-between px-12 py-12 lg:flex lg:w-[45%]"
        style={{ background: "linear-gradient(160deg, #14352a 0%, #1b4332 55%, #0d2419 100%)" }}
      >
        <div />
        <div className="text-center">
          <Image
            src="/logo-home.png"
            alt="The Biology Bloke Edventures"
            width={200}
            height={200}
            className="mx-auto h-36 w-auto drop-shadow-2xl"
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
          The Biology Bloke - Conservation education for schools
        </p>
      </div>

      {/* Right panel: form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-cream px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 flex justify-center lg:hidden">
            <Image
              src="/logo-home.png"
              alt="The Biology Bloke Edventures"
              width={100}
              height={100}
              className="h-16 w-auto"
            />
          </div>

          <div className="mb-1 flex items-center justify-between">
            <h2 className="display text-2xl font-bold text-forest-900">Teacher sign in</h2>
            <Link
              href="/register"
              className="text-sm font-semibold text-forest-700 hover:underline"
            >
              Create account
            </Link>
          </div>
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
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-semibold text-forest-900">Password</label>
              </div>
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

          <div className="mt-6 text-center">
            <p className="text-sm text-charcoal-soft">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-semibold text-forest-700 hover:underline">
                Create one now
              </Link>
            </p>
          </div>

          <div className="mt-8 border-t border-sand pt-6 text-center">
            <p className="text-xs text-charcoal-soft">
              Student?{" "}
              <Link href="/" className="font-semibold text-forest-700 hover:underline">
                Enter your class code on the home page
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

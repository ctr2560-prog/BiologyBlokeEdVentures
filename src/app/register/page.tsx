"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { Button, inputClass } from "@/components/ui/primitives";
import { UserPlus } from "lucide-react";

export default function RegisterPage() {
  const { signIn } = useApp();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Registration failed. Please try again.");
        setLoading(false);
        return;
      }

      // Auto sign-in after successful registration.
      const { error: signInError } = await signIn(email.trim(), password);
      if (signInError) {
        // Registration worked but sign-in failed - redirect to login.
        router.push("/login?registered=1");
        return;
      }
      router.push("/teacher");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
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
            Your class is waiting<br />for an Edventure.
          </h1>
          <p className="mt-3 text-base text-forest-100/70">
            Set up your free teacher account and start assigning wildlife reels today.
          </p>
          <div className="mt-10 space-y-3 text-left">
            {[
              "Takes less than 2 minutes to get started",
              "No credit card required",
              "Full access to all units and content",
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
            <h2 className="display text-2xl font-bold text-forest-900">Create teacher account</h2>
            <Link
              href="/login"
              className="text-sm font-semibold text-forest-700 hover:underline"
            >
              Sign in
            </Link>
          </div>
          <p className="mb-7 text-sm text-charcoal-soft">
            Get started with adaptive conservation education for your class.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-forest-900">
                Your name
              </label>
              <input
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ms Smith"
                className={inputClass + " w-full"}
                disabled={loading}
              />
            </div>

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
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className={inputClass + " w-full"}
                disabled={loading}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-forest-900">
                Confirm password
              </label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat your password"
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
              <UserPlus className="h-4 w-4" aria-hidden />
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-charcoal-soft">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-forest-700 hover:underline">
                Sign in
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

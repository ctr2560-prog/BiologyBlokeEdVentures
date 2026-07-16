"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { Button, inputClass } from "@/components/ui/primitives";
import { ArrowLeft, Loader, PlusCircle, School, Search, UserPlus, X } from "lucide-react";

type SchoolResult = { name: string; suburb: string; state: string };

export default function RegisterPage() {
  const { signIn } = useApp();
  const router = useRouter();

  const [name, setName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [schoolLocation, setSchoolLocation] = useState("");
  const [schoolQuery, setSchoolQuery] = useState("");
  const [schoolResults, setSchoolResults] = useState<SchoolResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [schoolSearching, setSchoolSearching] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const schoolRef = useRef<HTMLDivElement>(null);

  // Debounced school search
  useEffect(() => {
    if (schoolQuery.length < 2) {
      setSchoolResults([]);
      setShowDropdown(false);
      return;
    }
    const t = setTimeout(async () => {
      setSchoolSearching(true);
      try {
        const res = await fetch(`/api/schools?q=${encodeURIComponent(schoolQuery)}`);
        const data: SchoolResult[] = await res.json();
        setSchoolResults(data);
        setShowDropdown(true);
      } catch {
        setSchoolResults([]);
      } finally {
        setSchoolSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [schoolQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (schoolRef.current && !schoolRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const selectSchool = (s: SchoolResult) => {
    setSchoolName(s.name);
    setSchoolLocation([s.suburb, s.state].filter(Boolean).join(", "));
    setSchoolQuery("");
    setShowDropdown(false);
  };

  const addCustomSchool = () => {
    if (schoolQuery.trim()) {
      setSchoolName(schoolQuery.trim());
      setSchoolLocation("");
      setSchoolQuery("");
      setShowDropdown(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!schoolName.trim()) {
      setError("Please select or add your school.");
      return;
    }
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
        body: JSON.stringify({ name, email, password, schoolName, schoolLocation }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Registration failed. Please try again.");
        setLoading(false);
        return;
      }

      const { error: signInError } = await signIn(email.trim(), password);
      if (signInError) {
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
            src="/edventra-white.png"
            alt="Edventra"
            width={472}
            height={119}
            className="mx-auto h-auto w-4/5 max-w-xs drop-shadow-2xl"
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

            <h2 className="display mb-1 text-2xl font-bold text-forest-900">
              Create teacher account
            </h2>
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

              {/* School search */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-forest-900">
                  School
                </label>
                <div ref={schoolRef} className="relative">
                  {schoolName ? (
                    <div className="flex items-center gap-2 rounded-xl border border-forest-300 bg-forest-50 px-3 py-2.5">
                      <School className="h-4 w-4 shrink-0 text-forest-600" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-forest-900">{schoolName}</p>
                        {schoolLocation && (
                          <p className="truncate text-xs text-charcoal-soft">{schoolLocation}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => { setSchoolName(""); setSchoolLocation(""); }}
                        className="shrink-0 text-charcoal-soft hover:text-forest-900"
                        aria-label="Clear school"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-soft" aria-hidden />
                        <input
                          type="text"
                          value={schoolQuery}
                          onChange={(e) => setSchoolQuery(e.target.value)}
                          onFocus={() => schoolResults.length > 0 && setShowDropdown(true)}
                          placeholder="Search for your school..."
                          className={inputClass + " w-full pl-9 pr-9"}
                          disabled={loading}
                          autoComplete="off"
                        />
                        {schoolSearching && (
                          <Loader className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-charcoal-soft" aria-hidden />
                        )}
                      </div>

                      {showDropdown && (schoolResults.length > 0 || (schoolQuery.length >= 2 && !schoolSearching)) && (
                        <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-sand bg-white shadow-xl">
                          {schoolResults.map((s) => (
                            <button
                              key={`${s.name}-${s.suburb}`}
                              type="button"
                              className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-forest-50"
                              onClick={() => selectSchool(s)}
                            >
                              <School className="h-4 w-4 shrink-0 text-forest-400" aria-hidden />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-forest-900">{s.name}</p>
                                {(s.suburb || s.state) && (
                                  <p className="text-xs text-charcoal-soft">
                                    {[s.suburb, s.state].filter(Boolean).join(", ")}
                                  </p>
                                )}
                              </div>
                            </button>
                          ))}

                          {schoolResults.length === 0 && schoolQuery.length >= 2 && !schoolSearching && (
                            <div className="px-4 py-3 text-sm text-charcoal-soft">
                              No schools found for &ldquo;{schoolQuery}&rdquo;
                            </div>
                          )}

                          {schoolQuery.trim() && (
                            <button
                              type="button"
                              className="flex w-full items-center gap-2 border-t border-sand px-4 py-2.5 text-left hover:bg-forest-50"
                              onClick={addCustomSchool}
                            >
                              <PlusCircle className="h-4 w-4 shrink-0 text-forest-600" aria-hidden />
                              <span className="text-sm font-medium text-forest-700">
                                Add &ldquo;{schoolQuery.trim()}&rdquo;
                              </span>
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
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

        <div className="mt-auto" />
      </div>
    </div>
  );
}

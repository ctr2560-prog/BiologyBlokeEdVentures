"use client";
/*
 * Landing page, cinematic, centered brand splash inspired by editorial nature
 * education sites (big bold headline over full-bleed darkened wildlife media,
 * slim top nav, scroll cue), followed by clean marketing sections and a
 * working sign-in. Login is fully functional: account-type selector,
 * email/password (visual for the MVP) and one-tap demo logins.
 */
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { roleHome, roleLabel } from "@/components/layout/navConfig";
import { Button, Modal, inputClass } from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/Reveal";
import { ScrollProgress } from "@/components/ui/motion";
import { PlatformTabs } from "@/components/layout/PlatformTabs";
import {
  WhyShortForm,
  HowItWorks,
  ContentShowcase,
  FounderStory,
} from "@/components/layout/LandingSections";
import { getClassByCode, getStudentsByClass } from "@/lib/supabaseService";
import { getAnimal } from "@/data/animals";
import { getAnimalIcon, getAnimalColor } from "@/lib/icons";
import {
  Globe,
  Compass,
  Film,
  Check,
  PlayCircle,
  HelpCircle,
  Layers,
  ChevronDown,
} from "lucide-react";
import type { ClassGroup, User } from "@/types";

const features = [
  "Curriculum-aligned units for Stage 3-5",
  "Short, high-quality wildlife reels",
  "Adaptive tasks personalised to each student",
  "Live class insights & printable reports",
  "Explorer points & badges to drive engagement",
];

export default function LandingPage() {
  const { signInStudent } = useApp();
  const router = useRouter();

  // Student login: step 1 = class code, step 2 = pick your animal.
  const [codeOpen, setCodeOpen] = useState(false);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);
  const [pickClass, setPickClass] = useState<ClassGroup | null>(null);
  const [pickStudents, setPickStudents] = useState<User[]>([]);
  const [pickLoading, setPickLoading] = useState(false);

  const openCodeModal = () => {
    setCode("");
    setCodeError("");
    setPickClass(null);
    setPickStudents([]);
    setCodeOpen(true);
  };

  const submitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError("");
    setCodeLoading(true);
    const cls = await getClassByCode(code.trim());
    if (!cls) {
      setCodeError("We couldn't find that class code. Check with your teacher.");
      setCodeLoading(false);
      return;
    }
    const students = await getStudentsByClass(cls.id);
    setPickClass(cls);
    setPickStudents(students);
    setCodeLoading(false);
  };

  const pickAnimal = async (studentId: string) => {
    if (!pickClass) return;
    setPickLoading(true);
    const { error } = await signInStudent(code.trim(), studentId);
    if (error) {
      setCodeError(error);
      setPickClass(null);
      setPickStudents([]);
      setPickLoading(false);
      return;
    }
    router.push(roleHome.student);
  };

  return (
    <div className="bg-cream">
      <ScrollProgress />
      {/* ============ Top nav ============ */}
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex max-w-6xl items-center justify-end px-6 py-5">
          <nav className="flex items-center gap-3">
            <a
              href="/login"
              className="text-sm font-medium text-cream/55 hover:text-cream/80"
            >
              Teacher sign in
            </a>
            <a
              href="/register"
              className="rounded-full bg-cream px-5 py-2 text-sm font-semibold text-forest-900 shadow-soft hover:bg-cream/90"
            >
              Sign up your school
            </a>
            <button
              onClick={openCodeModal}
              className="rounded-full bg-gold-400 px-5 py-2 text-sm font-semibold text-forest-900 shadow-soft hover:bg-gold-300"
            >
              Student code
            </button>
          </nav>
        </div>
      </header>

      {/* ============ Hero, centered brand splash ============ */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-forest-950 text-center">
        {/* Live wildlife film */}
        <video
          className="ken-burns absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster="/intro-poster.jpg"
          preload="auto"
          aria-hidden
        >
          <source src="/intro-bg.mp4" type="video/mp4" />
        </video>

        {/* Cinematic darkening for legibility */}
        <div className="grain pointer-events-none absolute inset-0">
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(9,26,18,0.72) 0%, rgba(9,26,18,0.55) 40%, rgba(9,26,18,0.86) 100%)" }} />
          <div className="absolute inset-0" style={{ background: "radial-gradient(110% 90% at 50% 48%, transparent 40%, rgba(5,17,11,0.88) 100%)" }} />
        </div>

        {/* Centered copy */}
        <div className="rise-in relative z-10 mx-auto max-w-4xl px-6">
          {/* Logo - reduced ~18% from previous size */}
          <Image
            src="/logo-home.png"
            alt="The Biology Bloke Edventures"
            width={420}
            height={420}
            priority
            className="float-y-slow mx-auto h-36 w-auto drop-shadow-2xl md:h-52"
          />
          <p className="mx-auto mt-2 inline-flex items-center gap-2 rounded-full border border-cream/20 bg-forest-950/40 px-4 py-1.5 text-[0.65rem] font-semibold uppercase tracking-widest text-cream/90 backdrop-blur">
            <Globe className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Adaptive short-form learning, built for the real world
          </p>
          <h1 className="display mt-4 text-4xl font-bold leading-[1.08] text-cream drop-shadow-xl md:text-5xl">
            Bringing the wild to every classroom,
            <br className="hidden sm:block" />
            and every learner to the wild.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-balance text-base text-cream/95 md:text-lg">
            Students explore real wildlife through short-form videos and personalised
            activities that adapt to their understanding, interests and learning needs,
            turning curiosity into action across the curriculum.
          </p>

        </div>

        {/* Scroll cue */}
        <a href="#how" className="absolute inset-x-0 bottom-6 z-10 flex flex-col items-center gap-1 text-cream/80 transition-colors hover:text-cream">
          <span className="text-[0.65rem] font-semibold uppercase tracking-widest">Discover more</span>
          <ChevronDown className="float-y-fast h-4 w-4" aria-hidden />
        </a>
      </section>

      <WhyShortForm />
      <HowItWorks />

      {/* ============ What you get (clean white section) ============ */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-8 px-6 py-20 md:py-28">
        <Reveal>
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-forest-600">
              Built for real classrooms
            </p>
            <h2 className="display mt-3 text-3xl font-bold leading-tight text-forest-900 md:text-5xl">
              Everything you need to teach through nature.
            </h2>
            <p className="mt-4 max-w-md text-lg text-charcoal-soft">
              No preparation required. Ready-to-teach units built around short,
              cinematic wildlife films, with the platform doing the personalising.
            </p>
            <ul className="mt-6 space-y-3">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-charcoal">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-forest-100 text-forest-700">
                    <Check className="h-3.5 w-3.5" aria-hidden strokeWidth={3} />
                  </span>
                  <span className="text-base">{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Portrait reel card with floating stat cards */}
          <div className="relative mx-auto w-full max-w-[320px]">
            {/* Phone-style short-form reel */}
            <div className="relative aspect-[9/16] overflow-hidden rounded-[2rem] bg-forest-950 shadow-hero ring-1 ring-black/10">
              <video
                className="h-full w-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                poster="/reel-following-poster.jpg"
                preload="metadata"
                aria-label="Short-form wildlife reel: walking behind chimps in Uganda"
              >
                <source src="/reel-following.mp4" type="video/mp4" />
              </video>
              {/* subtle bottom scrim + reel label */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-forest-950/80 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 text-cream">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-cream">
                  <Film className="h-4 w-4 text-forest-700" aria-hidden />
                </span>
                <span className="text-xs font-semibold drop-shadow">A BioBloke reel · Great Apes</span>
              </div>
            </div>

            {/* Floating stat cards */}
            <div className="float-y-slow absolute -left-4 top-10 rounded-2xl bg-white p-4 shadow-lift ring-1 ring-black/5">
              <p className="display text-3xl font-bold text-clay-500">3</p>
              <p className="text-xs font-medium text-charcoal-soft">Stages · Yr 5-10</p>
            </div>
            <div className="float-y absolute -right-5 bottom-14 rounded-2xl bg-white p-4 shadow-lift ring-1 ring-black/5">
              <p className="display text-3xl font-bold text-forest-600">100%</p>
              <p className="text-xs font-medium text-charcoal-soft">Adaptive to each student</p>
            </div>
          </div>
        </div>
        </Reveal>
      </section>

      {/* ============ One platform, every role (tabs) ============ */}
      <section className="bg-cream-dark/40 px-6 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-forest-600">
                One platform, every role
              </p>
              <h2 className="display mt-3 text-3xl font-bold text-forest-900 md:text-5xl">
                Made for teachers, students &amp; schools.
              </h2>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <PlatformTabs />
          </Reveal>
        </div>
      </section>

      <ContentShowcase />
      <FounderStory />

      {/* ============ Sample content showcase ============ */}
      <section className="bg-cream-dark/30 px-6 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="mb-12 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-forest-600">
                Free samples
              </p>
              <h2 className="display mt-3 text-3xl font-bold text-forest-900 md:text-4xl">
                See what students experience
              </h2>
              <p className="mt-3 text-base text-charcoal-soft">
                A taste of a real BioBloke Edventure, from reel to reflection.
              </p>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              {/* Sample: Reel */}
              <div className="overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-black/5">
                <div className="relative aspect-[9/5] overflow-hidden bg-forest-950">
                  <video
                    className="h-full w-full object-cover opacity-80"
                    autoPlay muted loop playsInline poster="/reel-following-poster.jpg" preload="metadata" aria-hidden
                  >
                    <source src="/reel-following.mp4" type="video/mp4" />
                  </video>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-cream/90 shadow-lift">
                      <PlayCircle className="h-7 w-7 text-forest-700" aria-hidden />
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <span className="rounded-full bg-forest-700/80 px-2.5 py-1 text-xs font-semibold text-cream backdrop-blur">1 min 40 sec</span>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-forest-600">Wildlife Reel</p>
                  <h3 className="display mt-1 font-bold text-forest-900">Naptime is over!</h3>
                  <p className="mt-1 text-sm text-charcoal-soft">Watch a troop of chimpanzees wake up and start their morning in Uganda&apos;s Kibale Forest.</p>
                </div>
              </div>

              {/* Sample: Quiz */}
              <div className="overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-black/5">
                <div className="flex aspect-[9/5] items-center justify-center bg-gradient-to-br from-sand/60 to-gold/20">
                  <HelpCircle className="h-16 w-16 text-gold-600/60" aria-hidden strokeWidth={1.2} />
                </div>
                <div className="p-5">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-forest-600">Quick Quiz</p>
                  <h3 className="display mt-1 font-bold text-forest-900">What do chimps eat?</h3>
                  <p className="mt-1 text-sm text-charcoal-soft">Five quick-fire questions to check your understanding before the adaptive tasks unlock.</p>
                  <div className="mt-4 space-y-2">
                    {["Fruit, leaves and insects", "Only fruit", "Meat and fish"].map((opt, i) => (
                      <div key={opt} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${i === 0 ? "bg-forest-100 font-semibold text-forest-800" : "bg-cream text-charcoal-soft"}`}>
                        <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-xs font-bold ${i === 0 ? "bg-forest-600 text-cream" : "bg-sand text-charcoal-soft"}`}>{String.fromCharCode(65 + i)}</span>
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sample: Adaptive activity */}
              <div className="overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-black/5">
                <div className="flex aspect-[9/5] items-center justify-center bg-gradient-to-br from-mist/40 to-forest-100/60">
                  <Layers className="h-16 w-16 text-forest-600/50" aria-hidden strokeWidth={1.2} />
                </div>
                <div className="p-5">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-forest-600">Adaptive Activity</p>
                  <h3 className="display mt-1 font-bold text-forest-900">Great Ape habitat map</h3>
                  <p className="mt-1 text-sm text-charcoal-soft">Three tiers, automatically assigned based on quiz results. Every student gets exactly the right challenge.</p>
                  <div className="mt-4 flex gap-2">
                    {[["Foundation", "bg-clay-100 text-clay-700"], ["Core", "bg-gold/20 text-gold-700"], ["Advanced", "bg-forest-100 text-forest-700"]].map(([label, cls]) => (
                      <span key={label} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>{label}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={160}>
            <div className="mt-10 text-center">
              <button
                onClick={openCodeModal}
                className="inline-flex items-center gap-2 rounded-full bg-forest-700 px-7 py-3 text-sm font-semibold text-cream shadow-soft hover:bg-forest-800 transition-colors"
              >
                <Compass className="h-4 w-4" aria-hidden />
                Enter class code to explore
              </button>
              <p className="mt-3 text-xs text-charcoal-soft">
                Have a school account?{" "}
                <a href="/login" className="font-semibold text-forest-700 hover:underline">Teacher sign in</a>
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ Footer with discrete admin link ============ */}
      <footer className="border-t border-black/6 bg-cream px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-xs text-charcoal-soft/60 sm:flex-row">
          <span>The Biology Bloke Edventures · Conservation education for Australian schools</span>
          <div className="flex items-center gap-4">
            <a href="/register" className="hover:text-charcoal-soft hover:underline">Sign up your school</a>
            <span>·</span>
            <a href="/login" className="hover:text-charcoal-soft hover:underline">Admin</a>
          </div>
        </div>
      </footer>

      {/* ============ Student code modal ============ */}
      <Modal
        open={codeOpen}
        onClose={() => setCodeOpen(false)}
        title={pickClass ? "Which animal are you?" : "Enter your class code"}
        maxWidth={pickClass ? "max-w-lg" : "max-w-md"}
      >
        {!pickClass ? (
          <form onSubmit={submitCode} className="space-y-4">
            <div className="grid place-items-center py-2">
              <Compass className="h-12 w-12 text-forest-600" aria-hidden />
            </div>
            <p className="text-center text-sm text-charcoal-soft">
              Ask your teacher for your class code, then pop it in below to start your Edventure.
            </p>
            <input
              value={code}
              onChange={(e) => { setCode(e.target.value); setCodeError(""); }}
              placeholder="Your class code"
              autoFocus
              className={`${inputClass} text-center text-lg font-bold uppercase tracking-widest`}
            />
            {codeError && <p className="text-center text-sm font-medium text-clay-600">{codeError}</p>}
            <Button type="submit" size="lg" className="w-full" disabled={codeLoading}>
              {codeLoading ? "Looking up..." : "Next"}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-center text-sm text-charcoal-soft">
              Tap your explorer animal for <b>{pickClass.name}</b>.
            </p>
            {pickLoading ? (
              <div className="py-8 text-center text-sm text-charcoal-soft">Signing you in...</div>
            ) : (
              <div className="grid max-h-[55vh] grid-cols-3 gap-2.5 overflow-y-auto sm:grid-cols-4">
                {pickStudents.map((s) => {
                  const animal = getAnimal(s.animalId ?? "");
                  if (!animal) return null;
                  const Icon = getAnimalIcon(animal.kind);
                  return (
                    <button
                      key={s.id}
                      onClick={() => pickAnimal(s.id)}
                      className="card-lift group flex flex-col items-center gap-2 overflow-hidden rounded-2xl p-3 text-cream shadow-soft"
                      style={{ background: `linear-gradient(150deg, ${getAnimalColor(animal.id)}, #0d2419)` }}
                    >
                      <Icon className="h-8 w-8 transition-transform group-hover:scale-110" aria-hidden strokeWidth={1.5} />
                      <span className="text-xs font-semibold">{animal.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
            {codeError && <p className="text-center text-sm font-medium text-clay-600">{codeError}</p>}
            <button
              onClick={() => { setPickClass(null); setPickStudents([]); setCodeError(""); }}
              className="w-full text-center text-xs font-semibold text-forest-700 hover:underline"
            >
              Wrong class? Go back
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}

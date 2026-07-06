"use client";
/*
 * Marketing sections for the landing page, brought alive with scroll-motion:
 * - WhyShortForm: animated heading + in-view count-up impact band
 * - HowItWorks: a sticky scroll-stepper (pins while the loop advances)
 * - ContentShowcase: tilt cards + dual marquees
 * - FounderStory: parallax video panel
 *
 * Icons are SVG (lucide-react), no emojis, no em dashes.
 */
import { Reveal } from "@/components/ui/Reveal";
import {
  Parallax,
  CountUp,
  TiltCard,
  Marquee,
  Aurora,
  AnimatedHeading,
  useSectionProgress,
} from "@/components/ui/motion";
import { exploreEcosystems, videos } from "@/data/content";
import { getEcoIcon } from "@/lib/icons";
import {
  Timer,
  Smartphone,
  Globe,
  ClipboardList,
  Film,
  Compass,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

const eyebrow = "text-sm font-semibold uppercase tracking-[0.2em]";

/* ---------- Why short-form ---------- */
export function WhyShortForm() {
  const stats: { v: string; l: string; Icon: LucideIcon }[] = [
    { v: "60-120s", l: "The length of a BioBloke reel", Icon: Timer },
    { v: "Where they scroll", l: "Learning in the format kids already love", Icon: Smartphone },
    { v: "Real nature", l: "Original conservation footage, never stock", Icon: Globe },
  ];
  const impact = [
    { to: 3, suffix: "", l: "Stages, Year 5 to 10" },
    { to: 15, suffix: "", l: "Curriculum topics" },
    { to: 7, suffix: "", l: "Cinematic reels" },
    { to: 100, suffix: "%", l: "Adaptive to each learner" },
  ];
  return (
    <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
      <div className="mx-auto max-w-3xl text-center">
        <Reveal>
          <p className={`${eyebrow} text-forest-600`}>Why short-form</p>
        </Reveal>
        <AnimatedHeading
          text="Kids already learn in reels. We just made them count."
          className="display mt-3 text-3xl font-bold leading-tight text-forest-900 md:text-5xl"
        />
        <Reveal delay={100}>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-charcoal-soft">
            The average student watches hours of short-form video every day, yet spends
            less time in the natural world than any generation before them. BioBloke meets
            them where their attention already lives, then turns 60 seconds of wonder into
            real, lasting learning.
          </p>
        </Reveal>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s, i) => (
          <Reveal key={s.l} delay={i * 100}>
            <TiltCard glare className="h-full rounded-3xl bg-white p-6 text-center shadow-soft ring-1 ring-black/5">
              <s.Icon className="mx-auto h-9 w-9 text-forest-600" aria-hidden strokeWidth={1.75} />
              <p className="display mt-3 text-2xl font-bold text-forest-800">{s.v}</p>
              <p className="mt-1 text-sm text-charcoal-soft">{s.l}</p>
            </TiltCard>
          </Reveal>
        ))}
      </div>

      {/* Count-up impact band */}
      <Reveal>
        <div className="mt-6 grid grid-cols-2 gap-4 rounded-3xl bg-forest-50 p-6 sm:grid-cols-4">
          {impact.map((s) => (
            <div key={s.l} className="text-center">
              <p className="display text-4xl font-bold text-forest-700 md:text-5xl">
                <CountUp to={s.to} suffix={s.suffix} />
              </p>
              <p className="mt-1 text-xs text-charcoal-soft md:text-sm">{s.l}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

/* ---------- How it works: sticky scroll-stepper ---------- */
const steps: { n: number; Icon: LucideIcon; t: string; d: string }[] = [
  { n: 1, Icon: ClipboardList, t: "Assign", d: "Teachers pick a unit or reel set for a class in seconds." },
  { n: 2, Icon: Film, t: "Watch", d: "Students watch cinematic wildlife reels at their own pace." },
  { n: 3, Icon: Compass, t: "Adapt", d: "The platform reads watch-time, quizzes and curiosity to set each student's next mission." },
  { n: 4, Icon: BarChart3, t: "Insight", d: "Teachers see who is thriving and who needs a hand, live." },
];

export function HowItWorks() {
  const { ref, progress } = useSectionProgress();
  const active = Math.min(steps.length - 1, Math.floor(progress * steps.length));
  const ActiveIcon = steps[active].Icon;

  return (
    <section
      ref={ref}
      className="relative"
      style={{ height: `${steps.length * 85 + 40}vh`, background: "linear-gradient(160deg, #14352a 0%, #1b4332 55%, #0d2419 100%)" }}
    >
      <Aurora />
      <div className="sticky top-0 flex h-screen items-center overflow-hidden px-6">
        <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 lg:grid-cols-2">
          {/* Left: step list + progress rail */}
          <div>
            <p className={`${eyebrow} text-forest-100/70`}>How it works</p>
            <h2 className="display mt-3 text-3xl font-bold text-cream md:text-5xl">
              One simple loop that personalises itself.
            </h2>
            <div className="mt-8 flex gap-4">
              {/* progress rail */}
              <div className="relative w-1 shrink-0 rounded-full bg-cream/15">
                <div
                  className="absolute inset-x-0 top-0 rounded-full bg-gradient-to-b from-forest-400 to-gold-400 transition-[height] duration-300"
                  style={{ height: `${((active + 1) / steps.length) * 100}%` }}
                />
              </div>
              <ul className="flex-1 space-y-4">
                {steps.map((s, i) => (
                  <li
                    key={s.n}
                    className={`transition-all duration-300 ${i === active ? "opacity-100" : "opacity-40"}`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-bold transition-colors ${
                          i === active ? "bg-cream text-forest-800" : "bg-cream/15 text-cream"
                        }`}
                      >
                        {s.n}
                      </span>
                      <span className="display text-lg font-bold text-cream">{s.t}</span>
                    </div>
                    {i === active && (
                      <p className="panel-in mt-1 pl-12 text-sm text-forest-100/85">{s.d}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right: big animated visual for the active step */}
          <div className="relative hidden lg:block">
            <div key={active} className="panel-in rounded-[2rem] bg-cream/95 p-10 shadow-hero">
              <div className="flex items-center justify-between">
                <span className="display text-7xl font-bold text-forest-100" style={{ WebkitTextStroke: "1px #2d6a4f" }}>
                  0{steps[active].n}
                </span>
                <span className="grid h-20 w-20 place-items-center rounded-3xl bg-forest-700 text-cream">
                  <ActiveIcon className="h-10 w-10" aria-hidden strokeWidth={1.5} />
                </span>
              </div>
              <h3 className="display mt-6 text-3xl font-bold text-forest-900">{steps[active].t}</h3>
              <p className="mt-2 text-lg text-charcoal-soft">{steps[active].d}</p>
              <div className="mt-6 flex gap-1.5">
                {steps.map((s, i) => (
                  <span
                    key={s.n}
                    className={`h-1.5 rounded-full transition-all duration-300 ${i === active ? "w-8 bg-forest-600" : "w-3 bg-sand-dark"}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Content & ecosystems showcase ---------- */
export function ContentShowcase() {
  return (
    <section className="overflow-hidden py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <p className={`${eyebrow} text-forest-600`}>Real places, real wonder</p>
          </Reveal>
          <AnimatedHeading
            text="Original reels from the world's wildest places."
            className="display mt-3 text-3xl font-bold leading-tight text-forest-900 md:text-5xl"
          />
          <Reveal delay={100}>
            <p className="mx-auto mt-5 max-w-xl text-lg text-charcoal-soft">
              From the rainforests of Borneo to the coral reefs of the Pacific, every wild
              place becomes a series of short, cinematic missions.
            </p>
          </Reveal>
        </div>

        {/* Ecosystem tilt grid */}
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {exploreEcosystems.map((eco, i) => {
            const Icon = getEcoIcon(eco.id);
            return (
              <Reveal key={eco.id} delay={(i % 4) * 80}>
                <TiltCard
                  glare
                  max={12}
                  className="group aspect-square overflow-hidden rounded-3xl p-5 text-cream shadow-soft"
                >
                  <div
                    className="absolute inset-0 rounded-[inherit]"
                    style={{ background: `linear-gradient(150deg, ${eco.color}, #0d2419)` }}
                  />
                  <div className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-[0.1]" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
                  <Icon className="absolute right-3 top-3 h-8 w-8 text-cream/90 transition-transform duration-300 group-hover:scale-125" aria-hidden strokeWidth={1.5} />
                  <div className="absolute inset-x-4 bottom-4">
                    <h3 className="display text-base font-bold">{eco.name}</h3>
                  </div>
                </TiltCard>
              </Reveal>
            );
          })}
        </div>
      </div>

      {/* Dual marquees */}
      <div className="mt-12 space-y-3">
        <Marquee durationSeconds={38}>
          {exploreEcosystems.map((eco) => {
            const Icon = getEcoIcon(eco.id);
            return (
              <span key={eco.id} className="inline-flex items-center gap-2 rounded-full bg-forest-50 px-5 py-2.5 text-base font-semibold text-forest-800">
                <Icon className="h-4 w-4" aria-hidden /> {eco.name}
              </span>
            );
          })}
        </Marquee>
        <Marquee durationSeconds={44} reverse>
          {videos.map((v) => (
            <span key={v.id} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-base font-medium text-charcoal ring-1 ring-sand">
              <Film className="h-4 w-4 text-forest-600" aria-hidden /> {v.title}
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  );
}

/* ---------- Founder story ---------- */
export function FounderStory() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
        {/* Visual with parallax */}
        <div className="order-2 lg:order-1">
          <Parallax speed={0.12}>
            <TiltCard max={6} className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-forest-950 shadow-hero ring-1 ring-black/10">
              <video className="ken-burns absolute inset-0 h-full w-full object-cover" autoPlay muted loop playsInline poster="/intro-poster.jpg" preload="metadata" aria-hidden>
                <source src="/intro-bg.mp4" type="video/mp4" />
              </video>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-forest-950/85 to-transparent" />
              <div className="absolute bottom-5 left-5 text-cream">
                <p className="text-xs font-semibold uppercase tracking-wider text-forest-100/70">Filmed by</p>
                <p className="display text-lg font-bold">Cameron Rodgers, The Biology Bloke</p>
              </div>
            </TiltCard>
          </Parallax>
        </div>

        {/* Story */}
        <div className="order-1 lg:order-2">
          <Reveal>
            <p className={`${eyebrow} text-forest-600`}>Meet the Biology Bloke</p>
          </Reveal>
          <AnimatedHeading
            text="Filmed by a zoo educator, not a stock library."
            className="display mt-3 text-3xl font-bold leading-tight text-forest-900 md:text-4xl"
          />
          <Reveal delay={100}>
            <p className="mt-4 text-lg text-charcoal-soft">
              BioBloke is built and filmed by Cameron Rodgers, a zoo education officer and
              wildlife filmmaker who has followed orangutans in Sumatra, big cats on the
              Masai Mara and marsupials across the Australian bush. Every reel is real
              footage, grounded in real science and real fieldwork.
            </p>
          </Reveal>
          <Reveal delay={160}>
            <blockquote className="mt-6 border-l-4 border-forest-500 pl-5">
              <p className="display text-xl font-semibold text-forest-900">
                &ldquo;The solution to the global conservation crisis is the development of
                continuous learning.&rdquo;
              </p>
              <footer className="mt-2 text-sm font-medium text-charcoal-soft">
                Cameron Rodgers, The Biology Bloke
              </footer>
            </blockquote>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

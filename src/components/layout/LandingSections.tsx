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
import { useEffect, useRef, useState } from "react";
import {
  Parallax,
  CountUp,
  TiltCard,
  Marquee,
  Aurora,
  AnimatedHeading,
} from "@/components/ui/motion";
import { exploreEcosystems } from "@/data/content";
import { getEcoIcon } from "@/lib/icons";
import {
  Timer,
  Smartphone,
  Globe,
  ClipboardList,
  Film,
  Compass,
  Sparkles,
  BarChart3,
  BookOpen,
  Calculator,
  FlaskConical,
  Landmark,
  Palette,
  Music,
  HeartPulse,
  PenTool,
  Leaf,
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

/* ---------- How it works: animated vertical timeline ---------- */
const steps: { Icon: LucideIcon; t: string; d: string }[] = [
  { Icon: ClipboardList, t: "Assign", d: "Teachers pick a unit or reel set for a class in seconds." },
  { Icon: Film, t: "Watch", d: "Students watch cinematic wildlife reels at their own pace." },
  { Icon: Compass, t: "Adapt", d: "The platform reads watch-time, quizzes and curiosity to understand each learner." },
  { Icon: Sparkles, t: "Personalise", d: "Every student is given work matched to them: support, core or extension." },
  { Icon: BarChart3, t: "Insight", d: "Teachers see who is thriving and who needs a hand, live." },
];

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const sweep = 1600; // ms for the rail to travel end to end
  const per = sweep / (steps.length - 1);

  return (
    <section
      className="relative overflow-hidden py-20 md:py-28"
      style={{ background: "linear-gradient(160deg, #14352a 0%, #1b4332 55%, #0d2419 100%)" }}
    >
      <Aurora />
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="text-center">
          <p className={`${eyebrow} text-forest-100/70`}>How it works</p>
          <AnimatedHeading
            text="One powerful loop that personalises itself."
            className="display mt-3 text-3xl font-bold text-cream md:text-5xl"
          />
        </div>

        {/* Horizontal timeline (scrolls sideways on small screens) */}
        <div ref={ref} className="mt-16 overflow-x-auto pb-4">
          <div className="relative flex min-w-[820px] gap-4 lg:min-w-0">
            {/* rail track spanning the node centres (10% to 90%) */}
            <div className="absolute left-[10%] right-[10%] top-[1.375rem] h-1 -translate-y-1/2 overflow-hidden rounded-full bg-cream/12">
              <div
                className="h-full rounded-full bg-gradient-to-r from-forest-400 via-forest-300 to-gold-400"
                style={{ width: inView ? "100%" : "0%", transition: `width ${sweep}ms ease-out` }}
              />
            </div>

            {steps.map((s, i) => (
              <div key={s.t} className="flex flex-1 flex-col items-center text-center">
                {/* node on the rail */}
                <span
                  className={`relative z-10 grid h-11 w-11 place-items-center rounded-2xl transition-all duration-500 ${
                    inView
                      ? "scale-100 bg-cream text-forest-800 shadow-lift"
                      : "scale-90 bg-forest-900/60 text-cream/60 ring-1 ring-cream/20"
                  }`}
                  style={{ transitionDelay: `${i * per}ms` }}
                >
                  <s.Icon className="h-5 w-5" aria-hidden strokeWidth={1.75} />
                </span>

                {/* card */}
                <div
                  className="mt-6 w-full rounded-3xl border border-cream/15 bg-cream/[0.06] p-5"
                  style={{
                    opacity: inView ? 1 : 0,
                    transform: inView ? "translateY(0)" : "translateY(16px)",
                    transition: "opacity 0.6s ease, transform 0.6s cubic-bezier(0.22,1,0.36,1)",
                    transitionDelay: `${i * per + 150}ms`,
                  }}
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-forest-100/60">
                    Step {i + 1}
                  </p>
                  <h3 className="display mt-1 text-lg font-bold text-cream">{s.t}</h3>
                  <p className="mt-1.5 text-sm text-forest-100/85">{s.d}</p>
                </div>
              </div>
            ))}
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
              From the rainforests of Sumatra to the savannahs of Africa, every wild place
              becomes a series of short, cinematic missions.
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

      {/* Dual marquees: a different key learning area in every reel */}
      <div className="mt-12 space-y-3">
        <Marquee durationSeconds={38}>
          {learningAreas.slice(0, 5).map((la) => (
            <span key={la.label} className="inline-flex items-center gap-2 rounded-full bg-forest-50 px-5 py-2.5 text-base font-semibold text-forest-800">
              <la.Icon className="h-4 w-4" aria-hidden /> {la.label}
            </span>
          ))}
        </Marquee>
        <Marquee durationSeconds={44} reverse>
          {learningAreas.slice(5).map((la) => (
            <span key={la.label} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-base font-medium text-charcoal ring-1 ring-sand">
              <la.Icon className="h-4 w-4 text-forest-600" aria-hidden /> {la.label}
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  );
}

/* A different key learning area brought to life in the wild. */
const learningAreas: { label: string; Icon: LucideIcon }[] = [
  { label: "Narrative in chimpanzee troops", Icon: BookOpen },
  { label: "Mathematics in the zoo", Icon: Calculator },
  { label: "Geography across the savannah", Icon: Globe },
  { label: "Science in the rainforest canopy", Icon: FlaskConical },
  { label: "History in ancient forests", Icon: Landmark },
  { label: "Visual art inspired by the wild", Icon: Palette },
  { label: "Music in the dawn chorus", Icon: Music },
  { label: "Wellbeing in the great outdoors", Icon: HeartPulse },
  { label: "Design a wildlife corridor", Icon: PenTool },
  { label: "Sustainability in action", Icon: Leaf },
];

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
              Biology Bloke is built and filmed by Cameron Rodgers, a multi-award-winning
              Australian educator and wildlife presenter on a mission to bring the natural
              world into every classroom. From orangutans in Sumatra to big cat country in
              East Africa and wildlife across Australia, every reel carries one belief: that
              learning is how we change the world.
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

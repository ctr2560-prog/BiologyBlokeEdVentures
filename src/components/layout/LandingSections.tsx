"use client";
/*
 * Marketing sections for the landing page that tell the BioBloke story:
 * - WhyShortForm: the core "world first" hook (meet kids in reels)
 * - HowItWorks: the adaptive loop in 4 steps
 * - ContentShowcase: original wildlife reels & ecosystems
 * - FounderStory: The Biology Bloke credibility (Cameron Rodgers)
 *
 * Icons are SVG (lucide-react), no emojis anywhere.
 */
import { Reveal } from "@/components/ui/Reveal";
import { exploreEcosystems, videos } from "@/data/content";
import {
  Timer,
  Smartphone,
  Globe,
  ClipboardList,
  Film,
  Compass,
  BarChart3,
  TreePalm,
  Trees,
  Fish,
  Bird,
  Sun,
  PawPrint,
  Cat,
  Rabbit,
  type LucideIcon,
} from "lucide-react";

const eyebrow = "text-sm font-semibold uppercase tracking-[0.2em]";

const ecoIcon: Record<string, LucideIcon> = {
  "eco-rainforest": TreePalm,
  "eco-bush": Trees,
  "eco-reef": Fish,
  "eco-wetlands": Bird,
  "eco-savanna": Sun,
  "eco-apes": PawPrint,
  "eco-cats": Cat,
  "eco-marsupials": Rabbit,
};

/* ---------- Why short-form ---------- */
export function WhyShortForm() {
  const stats: { v: string; l: string; Icon: LucideIcon }[] = [
    { v: "60–120s", l: "The length of a BioBloke reel", Icon: Timer },
    { v: "Where they scroll", l: "Learning in the format kids already love", Icon: Smartphone },
    { v: "Real nature", l: "Original conservation footage, never stock", Icon: Globe },
  ];
  return (
    <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
      <Reveal>
        <div className="mx-auto max-w-3xl text-center">
          <p className={`${eyebrow} text-forest-600`}>Why short-form</p>
          <h2 className="display mt-3 text-3xl font-bold leading-tight text-forest-900 md:text-5xl">
            Kids already learn in reels. We just made them count.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-charcoal-soft">
            The average student watches hours of short-form video every day, yet spends
            less time in the natural world than any generation before them. BioBloke meets
            them where their attention already lives, then turns 60 seconds of wonder into
            real, lasting learning.
          </p>
        </div>
      </Reveal>
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s, i) => (
          <Reveal key={s.l} delay={i * 100}>
            <div className="h-full rounded-3xl bg-white p-6 text-center shadow-soft ring-1 ring-black/5">
              <s.Icon className="mx-auto h-9 w-9 text-forest-600" aria-hidden strokeWidth={1.75} />
              <p className="display mt-3 text-2xl font-bold text-forest-800">{s.v}</p>
              <p className="mt-1 text-sm text-charcoal-soft">{s.l}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------- How it works ---------- */
export function HowItWorks() {
  const steps: { n: number; Icon: LucideIcon; t: string; d: string }[] = [
    { n: 1, Icon: ClipboardList, t: "Assign", d: "Teachers pick a unit or reel set for a class in seconds." },
    { n: 2, Icon: Film, t: "Watch", d: "Students watch cinematic wildlife reels at their own pace." },
    { n: 3, Icon: Compass, t: "Adapt", d: "The platform reads watch-time, quizzes & curiosity to set each student's next mission." },
    { n: 4, Icon: BarChart3, t: "Insight", d: "Teachers see who's thriving and who needs a hand, live." },
  ];
  return (
    <section
      className="relative overflow-hidden px-6 py-20 md:py-28"
      style={{ background: "linear-gradient(160deg, #14352a 0%, #1b4332 55%, #0d2419 100%)" }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "26px 26px" }} />
      <div className="relative mx-auto max-w-6xl">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className={`${eyebrow} text-forest-100/70`}>How it works</p>
            <h2 className="display mt-3 text-3xl font-bold text-cream md:text-5xl">
              One simple loop that personalises itself.
            </h2>
          </div>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 120}>
              <div className="relative h-full rounded-3xl bg-cream/95 p-6 shadow-hero">
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-forest-700 text-cream display text-lg font-bold">
                    {s.n}
                  </span>
                  <s.Icon className="h-7 w-7 text-forest-600" aria-hidden strokeWidth={1.75} />
                </div>
                <h3 className="display mt-4 text-lg font-bold text-forest-900">{s.t}</h3>
                <p className="mt-1 text-sm text-charcoal-soft">{s.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Content & ecosystems showcase ---------- */
export function ContentShowcase() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
      <Reveal>
        <div className="mx-auto max-w-2xl text-center">
          <p className={`${eyebrow} text-forest-600`}>Real places · real wonder</p>
          <h2 className="display mt-3 text-3xl font-bold leading-tight text-forest-900 md:text-5xl">
            Original reels from the world&apos;s wildest places.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-charcoal-soft">
            From the rainforests of Borneo to the coral reefs of the Pacific, every wild
            place becomes a series of short, cinematic missions.
          </p>
        </div>
      </Reveal>

      {/* Ecosystem wall */}
      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {exploreEcosystems.map((eco, i) => {
          const Icon = ecoIcon[eco.id] ?? Trees;
          return (
            <Reveal key={eco.id} delay={(i % 4) * 80}>
              <div
                className="card-lift group relative aspect-square overflow-hidden rounded-3xl p-5 text-cream shadow-soft"
                style={{ background: `linear-gradient(150deg, ${eco.color}, #0d2419)` }}
              >
                <div className="pointer-events-none absolute inset-0 opacity-[0.1]" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
                <Icon className="absolute right-3 top-3 h-8 w-8 text-cream/90 transition-transform group-hover:scale-110" aria-hidden strokeWidth={1.75} />
                <div className="absolute inset-x-4 bottom-4">
                  <h3 className="display text-base font-bold">{eco.name}</h3>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>

      {/* Reel titles strip */}
      <Reveal delay={120}>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {videos.slice(0, 6).map((v) => (
            <span key={v.id} className="inline-flex items-center gap-1.5 rounded-full bg-forest-50 px-4 py-2 text-sm font-medium text-forest-800">
              <Film className="h-3.5 w-3.5" aria-hidden />
              {v.title}
            </span>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

/* ---------- Founder story ---------- */
export function FounderStory() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
        {/* Visual */}
        <Reveal className="order-2 lg:order-1">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-forest-950 shadow-hero ring-1 ring-black/10">
            <video className="ken-burns h-full w-full object-cover" autoPlay muted loop playsInline poster="/intro-poster.jpg" preload="metadata" aria-hidden>
              <source src="/intro-bg.mp4" type="video/mp4" />
            </video>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-forest-950/85 to-transparent" />
            <div className="absolute bottom-5 left-5 text-cream">
              <p className="text-xs font-semibold uppercase tracking-wider text-forest-100/70">Filmed by</p>
              <p className="display text-lg font-bold">Cameron Rodgers · The Biology Bloke</p>
            </div>
          </div>
        </Reveal>

        {/* Story */}
        <Reveal delay={120} className="order-1 lg:order-2">
          <p className={`${eyebrow} text-forest-600`}>Meet the Biology Bloke</p>
          <h2 className="display mt-3 text-3xl font-bold leading-tight text-forest-900 md:text-4xl">
            Filmed by a zoo educator, not a stock library.
          </h2>
          <p className="mt-4 text-lg text-charcoal-soft">
            BioBloke is built and filmed by Cameron Rodgers, a zoo education officer and
            wildlife filmmaker who has followed orangutans in Sumatra, big cats on the
            Masai Mara and marsupials across the Australian bush. Every reel is real
            footage, grounded in real science and real fieldwork.
          </p>
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
    </section>
  );
}

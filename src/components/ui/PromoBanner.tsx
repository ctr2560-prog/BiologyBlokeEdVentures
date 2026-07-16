"use client";
/*
 * Promo banners shown on the teacher dashboard, edited from /admin/banner.
 * Nature Guardians-style: the feature image fills the banner edge to edge,
 * with a white content card floating on the left — eyebrow, headline, body
 * and a dark pill CTA. Multiple banners rotate as a carousel.
 */
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { SiteBanner } from "@/types";

export function PromoBanner({ banner }: { banner: SiteBanner }) {
  const hasCta = banner.linkUrl && banner.linkLabel;
  return (
    <div className="relative overflow-hidden rounded-3xl shadow-hero">
      {/* Full-bleed background */}
      {banner.imageUrl ? (
        <>
          <Image
            src={banner.imageUrl}
            alt=""
            fill
            className="object-cover"
            style={{ objectPosition: `${banner.imagePosX ?? 50}% ${banner.imagePosY ?? 50}%` }}
            sizes="(max-width: 1024px) 100vw, 896px"
            priority
          />
          <div className="absolute inset-0 bg-forest-950/15" />
        </>
      ) : (
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(120deg, #204535 0%, #3d7a5e 100%)" }}
        />
      )}

      {/* Floating content card */}
      <div className="relative p-5 md:p-9">
        <div className="max-w-lg rounded-3xl bg-white/[0.97] p-6 shadow-hero md:p-8">
          {banner.eyebrow && (
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-charcoal-soft">
              {banner.eyebrow}
            </p>
          )}
          {banner.title && (
            <h2 className="display mt-1.5 text-2xl font-bold leading-tight text-charcoal md:text-3xl">
              {banner.title}
            </h2>
          )}
          {banner.message && (
            <p className="mt-3 text-sm leading-relaxed text-charcoal-soft">{banner.message}</p>
          )}
          {hasCta && (
            <Link
              href={banner.linkUrl}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-charcoal px-6 py-3 text-sm font-bold text-cream transition-colors hover:bg-forest-950"
            >
              {banner.linkLabel} <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Rotating banner carousel: auto-advances every 8s (paused while hovered),
 * with arrows and dots when there's more than one banner.
 */
export function PromoBannerCarousel({ banners }: { banners: SiteBanner[] }) {
  const [index, setIndex] = useState(0);
  const hoverRef = useRef(false);

  const count = banners.length;
  const safeIndex = count > 0 ? Math.min(index, count - 1) : 0;

  useEffect(() => {
    if (count < 2) return;
    const timer = setInterval(() => {
      if (!hoverRef.current) setIndex((i) => (i + 1) % count);
    }, 8000);
    return () => clearInterval(timer);
  }, [count]);

  if (count === 0) return null;
  if (count === 1) return <PromoBanner banner={banners[0]} />;

  return (
    <div
      className="relative"
      onMouseEnter={() => { hoverRef.current = true; }}
      onMouseLeave={() => { hoverRef.current = false; }}
    >
      <div key={banners[safeIndex].id} className="rise-in">
        <PromoBanner banner={banners[safeIndex]} />
      </div>

      {/* Arrows */}
      <button
        onClick={() => setIndex((safeIndex - 1 + count) % count)}
        aria-label="Previous banner"
        className="absolute left-3 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-charcoal shadow-soft backdrop-blur transition-colors hover:bg-white"
      >
        <ChevronLeft className="h-5 w-5" aria-hidden />
      </button>
      <button
        onClick={() => setIndex((safeIndex + 1) % count)}
        aria-label="Next banner"
        className="absolute right-3 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-charcoal shadow-soft backdrop-blur transition-colors hover:bg-white"
      >
        <ChevronRight className="h-5 w-5" aria-hidden />
      </button>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5">
        {banners.map((b, i) => (
          <button
            key={b.id}
            onClick={() => setIndex(i)}
            aria-label={`Go to banner ${i + 1}`}
            className={`h-2 rounded-full transition-all ${
              i === safeIndex ? "w-5 bg-white" : "w-2 bg-white/50 hover:bg-white/75"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

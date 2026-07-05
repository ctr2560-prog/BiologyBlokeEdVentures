"use client";
import { useState } from "react";
import { SectionHeader, Badge, Modal } from "@/components/ui/primitives";
import { VideoCard } from "@/components/cards/ContentCards";
import { exploreEcosystems } from "@/data/content";
import { getVideos } from "@/lib/dataService";

export default function Explore() {
  const [active, setActive] = useState<string | null>(null);
  const activeEco = exploreEcosystems.find((e) => e.id === active);

  // Loosely match videos to an ecosystem by tag/animal keywords.
  const matchVideos = (name: string) => {
    const key = name.toLowerCase();
    return getVideos().filter((v) =>
      v.tags.some((t) => key.includes(t) || t.includes(key.split(" ")[0])) ||
      v.title.toLowerCase().includes(key.split(" ")[0])
    );
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Explore"
        subtitle="Wander through the world's wild places and follow your curiosity"
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {exploreEcosystems.map((eco) => (
          <button
            key={eco.id}
            onClick={() => setActive(eco.id)}
            className="card-lift group relative aspect-square overflow-hidden rounded-3xl p-5 text-left text-cream shadow-soft"
            style={{ background: `linear-gradient(150deg, ${eco.color}, #0d2419)` }}
          >
            <div className="pointer-events-none absolute inset-0 opacity-[0.1]" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
            <span className="absolute right-3 top-3 text-5xl drop-shadow-lg transition-transform group-hover:scale-110">{eco.emoji}</span>
            <div className="absolute inset-x-4 bottom-4">
              <h3 className="display text-lg font-bold">{eco.name}</h3>
              <p className="mt-1 line-clamp-2 text-xs text-forest-100/90">{eco.blurb}</p>
            </div>
          </button>
        ))}
      </div>

      <Modal open={!!active} onClose={() => setActive(null)} title={activeEco?.name ?? "Explore"} maxWidth="max-w-2xl">
        {activeEco && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl p-4 text-cream" style={{ background: `linear-gradient(120deg, ${activeEco.color}, #0d2419)` }}>
              <span className="text-5xl">{activeEco.emoji}</span>
              <p className="text-sm">{activeEco.blurb}</p>
            </div>
            <p className="text-sm font-semibold text-forest-900">Reels to explore</p>
            {matchVideos(activeEco.name).length ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {matchVideos(activeEco.name).map((v) => (
                  <VideoCard key={v.id} video={v} href={`/student/watch/${v.id}`} />
                ))}
              </div>
            ) : (
              <p className="rounded-2xl bg-cream/60 px-4 py-6 text-center text-sm text-charcoal-soft">
                🌱 New reels for this world are coming soon!
              </p>
            )}
            <Badge tone="gold">🔭 Curiosity earns bonus explorer points</Badge>
          </div>
        )}
      </Modal>
    </div>
  );
}

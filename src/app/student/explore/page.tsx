"use client";
import { useEffect, useState } from "react";
import { SectionHeader, Badge, Modal } from "@/components/ui/primitives";
import { VideoCard } from "@/components/cards/ContentCards";
import { getVideos, getEcosystems } from "@/lib/supabaseService";
import { getEcoIconByKey } from "@/lib/icons";
import type { Video, Ecosystem } from "@/types";

export default function Explore() {
  const [active, setActive] = useState<string | null>(null);
  const [ecosystems, setEcosystems] = useState<Ecosystem[]>([]);
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const activeEco = ecosystems.find((e) => e.id === active);

  useEffect(() => {
    Promise.all([getVideos(), getEcosystems()]).then(([videos, ecos]) => {
      setAllVideos(videos);
      setEcosystems(ecos.filter((e) => e.published));
      setLoading(false);
    });
  }, []);

  const matchVideos = (eco: Ecosystem) => {
    // Explicit tags win; otherwise fall back to matching on the world's name
    if (eco.tags.length > 0) {
      return allVideos.filter((v) => v.tags.some((t) => eco.tags.includes(t.toLowerCase())));
    }
    const key = eco.name.toLowerCase();
    return allVideos.filter(
      (v) =>
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

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-3xl bg-charcoal/8" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {ecosystems.map((eco) => {
            const Icon = getEcoIconByKey(eco.icon, eco.id);
            return (
              <button
                key={eco.id}
                onClick={() => setActive(eco.id)}
                className="card-lift group relative aspect-square overflow-hidden rounded-3xl p-5 text-left text-cream shadow-soft"
                style={{ background: `linear-gradient(150deg, ${eco.color}, #0d2419)` }}
              >
                <div className="pointer-events-none absolute inset-0 opacity-[0.1]" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
                <Icon className="absolute right-3 top-3 h-10 w-10 drop-shadow-lg transition-transform group-hover:scale-110" aria-hidden strokeWidth={1.5} />
                <div className="absolute inset-x-4 bottom-4">
                  <h3 className="display text-lg font-bold">{eco.name}</h3>
                  <p className="mt-1 line-clamp-2 text-xs text-forest-100/90">{eco.blurb}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Modal open={!!active} onClose={() => setActive(null)} title={activeEco?.name ?? "Explore"} maxWidth="max-w-2xl">
        {activeEco && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl p-4 text-cream" style={{ background: `linear-gradient(120deg, ${activeEco.color}, #0d2419)` }}>
              {(() => { const I = getEcoIconByKey(activeEco.icon, activeEco.id); return <I className="h-12 w-12 shrink-0" aria-hidden strokeWidth={1.5} />; })()}
              <p className="text-sm">{activeEco.blurb}</p>
            </div>
            <p className="text-sm font-semibold text-forest-900">Reels to explore</p>
            {matchVideos(activeEco).length ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {matchVideos(activeEco).map((v) => (
                  <VideoCard key={v.id} video={v} href={`/student/watch/${v.id}`} />
                ))}
              </div>
            ) : (
              <p className="rounded-2xl bg-cream/60 px-4 py-6 text-center text-sm text-charcoal-soft">
                New reels for this world are coming soon!
              </p>
            )}
            <Badge tone="gold">Curiosity earns bonus explorer points</Badge>
          </div>
        )}
      </Modal>
    </div>
  );
}

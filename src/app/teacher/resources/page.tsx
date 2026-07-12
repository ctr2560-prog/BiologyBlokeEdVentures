"use client";
import { useEffect, useState } from "react";
import { SectionHeader, inputClass, Badge } from "@/components/ui/primitives";
import { ResourceCard } from "@/components/cards/ContentCards";
import { getResources } from "@/lib/supabaseService";
import type { Resource } from "@/types";

type ResourceType = Resource["type"];
const TYPES: (ResourceType | "all")[] = [
  "all",
  "worksheet",
  "powerpoint",
  "teacherGuide",
  "assessment",
  "activity",
  "extension",
  "support",
];

export default function TeacherResources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<ResourceType | "all">("all");

  useEffect(() => {
    getResources().then((r) => {
      setResources(r);
      setLoading(false);
    });
  }, []);

  const filtered = resources.filter(
    (r) =>
      r.published &&
      r.title.toLowerCase().includes(query.toLowerCase()) &&
      (type === "all" || r.type === type)
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 animate-pulse rounded-2xl bg-charcoal/8" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-3xl bg-charcoal/8" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Resources"
        subtitle="Download worksheets, guides and activities for your lessons"
      />
      <div className="flex flex-wrap items-center gap-3 rounded-3xl bg-white p-3 shadow-soft ring-1 ring-black/5">
        <input
          className={`${inputClass} min-w-48 flex-1`}
          placeholder=" Search resources…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex flex-wrap gap-1.5">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                type === t ? "bg-forest-700 text-cream" : "bg-forest-50 text-forest-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {filtered.map((r) => (
          <ResourceCard key={r.id} resource={r} />
        ))}
      </div>
      {filtered.length === 0 && <Badge tone="neutral">No resources match your filters</Badge>}
    </div>
  );
}

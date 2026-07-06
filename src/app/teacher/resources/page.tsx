"use client";
import { useState } from "react";
import { SectionHeader, inputClass, Badge } from "@/components/ui/primitives";
import { ResourceCard } from "@/components/cards/ContentCards";
import { getResources } from "@/lib/dataService";
import type { ResourceType } from "@/types";

const TYPES: (ResourceType | "all")[] = ["all", "worksheet", "powerpoint", "teacherGuide", "assessment", "activity", "extension", "support"];

export default function TeacherResources() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<ResourceType | "all">("all");
  const resources = getResources().filter(
    (r) => r.published && r.title.toLowerCase().includes(query.toLowerCase()) && (type === "all" || r.type === type)
  );

  return (
    <div className="space-y-6">
      <SectionHeader title="Resources" subtitle="Download worksheets, guides and activities for your lessons" />
      <div className="flex flex-wrap items-center gap-3 rounded-3xl bg-white p-3 shadow-soft ring-1 ring-black/5">
        <input className={`${inputClass} flex-1 min-w-48`} placeholder=" Search resources…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="flex flex-wrap gap-1.5">
          {TYPES.map((t) => (
            <button key={t} onClick={() => setType(t)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${type === t ? "bg-forest-700 text-cream" : "bg-forest-50 text-forest-700"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {resources.map((r) => (
          <ResourceCard key={r.id} resource={r} />
        ))}
      </div>
      {resources.length === 0 && <Badge tone="neutral">No resources match your filters</Badge>}
    </div>
  );
}

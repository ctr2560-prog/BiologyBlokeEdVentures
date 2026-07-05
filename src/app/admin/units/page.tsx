"use client";
import { useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { SectionHeader, Button, Modal, Badge } from "@/components/ui/primitives";
import { UnitForm } from "@/components/forms/ContentForms";
import { getUnits, getTopicsByUnit } from "@/lib/dataService";

export default function UnitsPage() {
  const { version, bump } = useApp();
  const [modal, setModal] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const units = useMemo(() => {
    void version;
    return getUnits();
  }, [version]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Units & Topics"
        subtitle="Structure your curriculum — units contain topics, which hold videos, resources and quizzes"
        action={<Button onClick={() => setModal(true)}>➕ Create unit</Button>}
      />

      <div className="space-y-4">
        {units.map((unit) => {
          const topics = getTopicsByUnit(unit.id);
          const open = expanded === unit.id;
          return (
            <div key={unit.id} className="overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-black/5">
              <button
                onClick={() => setExpanded(open ? null : unit.id)}
                className="flex w-full items-center gap-4 p-5 text-left"
              >
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-forest-50 text-3xl">
                  {unit.coverEmoji}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="display text-lg font-bold text-forest-900">{unit.title}</h3>
                    <Badge tone="gold">{unit.stage}</Badge>
                    {!unit.published && <Badge tone="neutral">Draft</Badge>}
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-sm text-charcoal-soft">{unit.description}</p>
                </div>
                <div className="hidden shrink-0 items-center gap-3 text-sm text-charcoal-soft sm:flex">
                  <span>{topics.length} topics</span>
                  <span>{unit.durationLessons} lessons</span>
                  <span className="text-lg">{open ? "▲" : "▼"}</span>
                </div>
              </button>
              {open && (
                <div className="border-t border-sand bg-cream/40 p-5">
                  <div className="mb-4 grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-charcoal-soft">Year groups</p>
                      <p className="text-sm text-charcoal">{unit.yearGroups.join(", ")}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-charcoal-soft">Syllabus outcomes</p>
                      <ul className="text-sm text-charcoal">
                        {unit.outcomes.map((o) => (
                          <li key={o}>• {o}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-charcoal-soft">Topics</p>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {topics.map((t) => (
                      <div key={t.id} className="rounded-2xl bg-white p-3 ring-1 ring-sand">
                        <p className="font-semibold text-forest-900">{t.title}</p>
                        <div className="mt-1 flex gap-3 text-xs text-charcoal-soft">
                          <span>🎬 {t.videoIds.length}</span>
                          <span>📝 {t.resourceIds.length}</span>
                          <span>❓ {t.quizIds.length}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Create unit" maxWidth="max-w-2xl">
        <UnitForm
          onSaved={() => {
            bump();
            setModal(false);
          }}
        />
      </Modal>
    </div>
  );
}

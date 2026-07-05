"use client";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/lib/store";
import {
  SectionHeader,
  Button,
  Badge,
  Modal,
  FormField,
  inputClass,
} from "@/components/ui/primitives";
import { UnitCard } from "@/components/cards/ContentCards";
import {
  getPublishedUnits,
  getTopicsByUnit,
  getVideosByTopic,
  getClassesByTeacher,
  assignLessonToClass,
  getUnit,
} from "@/lib/dataService";
import { DEMO_TEACHER_ID } from "@/data/people";

function AssignInner() {
  const { currentUser, version, bump } = useApp();
  const teacherId = currentUser?.id ?? DEMO_TEACHER_ID;
  const searchParams = useSearchParams();
  const preselectedClass = searchParams.get("class");

  const [previewUnit, setPreviewUnit] = useState<string | null>(null);
  const [assignUnit, setAssignUnit] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  // Assign form state
  const [selectedClasses, setSelectedClasses] = useState<string[]>(preselectedClass ? [preselectedClass] : []);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("2026-07-25");
  const [adaptive, setAdaptive] = useState(true);
  const [points, setPoints] = useState(true);

  const units = useMemo(() => {
    void version;
    return getPublishedUnits();
  }, [version]);
  const classes = getClassesByTeacher(teacherId);

  const openAssign = (unitId: string) => {
    setAssignUnit(unitId);
    setPreviewUnit(null);
    setConfirmed(false);
    setSelectedTopics(getTopicsByUnit(unitId).map((t) => t.id));
    if (preselectedClass) setSelectedClasses([preselectedClass]);
  };

  const toggle = (arr: string[], id: string, set: (v: string[]) => void) =>
    set(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);

  const doAssign = () => {
    if (!assignUnit || selectedClasses.length === 0) return;
    selectedClasses.forEach((classId) =>
      assignLessonToClass({
        classId,
        unitId: assignUnit,
        topicIds: selectedTopics,
        dueDate,
        adaptiveTasksEnabled: adaptive,
        explorerPointsEnabled: points,
      })
    );
    bump();
    setConfirmed(true);
  };

  const previewTopics = previewUnit ? getTopicsByUnit(previewUnit) : [];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Assign Lessons"
        subtitle="Browse Edventures, preview the content, and assign to your classes"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {units.map((u) => (
          <div key={u.id} className="space-y-2">
            <div onClick={() => setPreviewUnit(u.id)} className="cursor-pointer">
              <UnitCard unit={u} href="#" />
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => setPreviewUnit(u.id)}>
                👁 Preview
              </Button>
              <Button size="sm" className="flex-1" onClick={() => openAssign(u.id)}>
                📌 Assign
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Preview modal */}
      <Modal open={!!previewUnit} onClose={() => setPreviewUnit(null)} title={getUnit(previewUnit ?? "")?.title ?? "Unit"} maxWidth="max-w-2xl">
        {previewUnit && (
          <div className="space-y-4">
            <p className="text-sm text-charcoal-soft">{getUnit(previewUnit)?.description}</p>
            {previewTopics.map((t) => (
              <div key={t.id} className="rounded-2xl bg-cream/60 p-4">
                <div className="flex items-center justify-between">
                  <h4 className="display font-bold text-forest-900">{t.title}</h4>
                  <Badge tone="sand">{t.difficulty}</Badge>
                </div>
                <p className="mt-1 text-sm text-charcoal-soft">{t.description}</p>
                <div className="mt-2 space-y-1">
                  {getVideosByTopic(t.id).map((v) => (
                    <div key={v.id} className="flex items-center gap-2 text-sm text-charcoal">
                      <span>{v.thumbEmoji}</span> {v.title}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <Button className="w-full" onClick={() => openAssign(previewUnit)}>
              Assign this unit →
            </Button>
          </div>
        )}
      </Modal>

      {/* Assign modal */}
      <Modal open={!!assignUnit} onClose={() => setAssignUnit(null)} title="Assign lesson" maxWidth="max-w-lg">
        {confirmed ? (
          <div className="text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-forest-50 text-3xl">✅</div>
            <h3 className="display mt-3 text-lg font-bold text-forest-900">Lesson assigned!</h3>
            <p className="mt-1 text-sm text-charcoal-soft">
              {getUnit(assignUnit ?? "")?.title} is now available to {selectedClasses.length}{" "}
              {selectedClasses.length === 1 ? "class" : "classes"}.
            </p>
            <Button className="mt-4" onClick={() => setAssignUnit(null)}>Done</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-semibold text-forest-900">Choose classes</p>
              <div className="space-y-2">
                {classes.map((c) => (
                  <label key={c.id} className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-3 ${selectedClasses.includes(c.id) ? "border-forest-600 bg-forest-50" : "border-sand"}`}>
                    <input type="checkbox" checked={selectedClasses.includes(c.id)} onChange={() => toggle(selectedClasses, c.id, setSelectedClasses)} />
                    <span className="text-sm font-semibold text-forest-900">{c.name}</span>
                    <Badge tone="sand" className="ml-auto">{c.yearGroup}</Badge>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-forest-900">Topics to include</p>
              <div className="flex flex-wrap gap-2">
                {getTopicsByUnit(assignUnit ?? "").map((t) => (
                  <button
                    key={t.id}
                    onClick={() => toggle(selectedTopics, t.id, setSelectedTopics)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${selectedTopics.includes(t.id) ? "bg-forest-700 text-cream" : "bg-forest-50 text-forest-700"}`}
                  >
                    {t.title}
                  </button>
                ))}
              </div>
            </div>

            <FormField label="Due date">
              <input type="date" className={inputClass} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </FormField>

            <div className="space-y-2">
              <ToggleRow label="🎯 Adaptive tasks" desc="Auto-assign support/core/extension tasks" value={adaptive} onChange={setAdaptive} />
              <ToggleRow label="⭐ Explorer points" desc="Students earn points for completing work" value={points} onChange={setPoints} />
            </div>

            <Button className="w-full" onClick={doAssign} disabled={selectedClasses.length === 0}>
              Assign to {selectedClasses.length || "…"} {selectedClasses.length === 1 ? "class" : "classes"}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}

function ToggleRow({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-cream/60 px-4 py-3">
      <div className="flex-1">
        <p className="text-sm font-semibold text-forest-900">{label}</p>
        <p className="text-xs text-charcoal-soft">{desc}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${value ? "bg-forest-600" : "bg-charcoal/20"}`}
        aria-pressed={value}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${value ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}

export default function AssignPage() {
  return (
    <Suspense fallback={<div className="p-8 text-charcoal-soft">Loading Edventures…</div>}>
      <AssignInner />
    </Suspense>
  );
}

"use client";
import { Suspense, useEffect, useState, useCallback } from "react";
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
import Link from "next/link";
import { Film, Tablet, MonitorPlay, Printer } from "lucide-react";
import type { DeliveryMode, Unit, ClassGroup, Topic, Video } from "@/types";
import { UnitCard } from "@/components/cards/ContentCards";
import {
  getPublishedUnits,
  getTopicsByUnit,
  getVideosByTopic,
  getClassesByTeacher,
  assignLessonToClass,
  getUnit,
} from "@/lib/supabaseService";
import { DEMO_TEACHER_ID } from "@/data/people";

type TopicWithVideos = Topic & { videos: Video[] };

function AssignInner() {
  const { currentUser } = useApp();
  const teacherId = currentUser?.id ?? DEMO_TEACHER_ID;
  const searchParams = useSearchParams();
  const preselectedClass = searchParams.get("class");

  const [units, setUnits] = useState<Unit[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // Preview modal
  const [previewUnit, setPreviewUnit] = useState<string | null>(null);
  const [previewUnitData, setPreviewUnitData] = useState<Unit | null>(null);
  const [previewTopics, setPreviewTopics] = useState<TopicWithVideos[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Assign modal
  const [assignUnit, setAssignUnit] = useState<string | null>(null);
  const [assignTopics, setAssignTopics] = useState<Topic[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [assigning, setAssigning] = useState(false);

  // Assign form state
  const [selectedClasses, setSelectedClasses] = useState<string[]>(
    preselectedClass ? [preselectedClass] : []
  );
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("2026-08-01");
  const [adaptive, setAdaptive] = useState(true);
  const [points, setPoints] = useState(true);
  const [mode, setMode] = useState<DeliveryMode>("student-led");

  // Load units + classes on mount
  useEffect(() => {
    Promise.all([getPublishedUnits(), getClassesByTeacher(teacherId)]).then(([u, c]) => {
      setUnits(u);
      setClasses(c);
      setLoading(false);
    });
  }, [teacherId]);

  // Load preview data when a unit is previewed
  useEffect(() => {
    if (!previewUnit) return;
    setPreviewLoading(true);
    Promise.all([getUnit(previewUnit), getTopicsByUnit(previewUnit)]).then(async ([unit, topics]) => {
      setPreviewUnitData(unit);
      const videoArrays = await Promise.all(topics.map((t) => getVideosByTopic(t.id)));
      setPreviewTopics(topics.map((t, i) => ({ ...t, videos: videoArrays[i] })));
      setPreviewLoading(false);
    });
  }, [previewUnit]);

  const openAssign = useCallback(async (unitId: string) => {
    setAssignUnit(unitId);
    setPreviewUnit(null);
    setConfirmed(false);
    if (preselectedClass) setSelectedClasses([preselectedClass]);
    const topics = await getTopicsByUnit(unitId);
    setAssignTopics(topics);
    setSelectedTopics(topics.map((t) => t.id));
  }, [preselectedClass]);

  const toggle = (arr: string[], id: string, set: (v: string[]) => void) =>
    set(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);

  const doAssign = async () => {
    if (!assignUnit || selectedClasses.length === 0) return;
    setAssigning(true);
    try {
      await Promise.all(
        selectedClasses.map((classId) =>
          assignLessonToClass({
            classId,
            unitId: assignUnit,
            topicIds: selectedTopics,
            dueDate,
            adaptiveTasksEnabled: adaptive,
            explorerPointsEnabled: points,
            deliveryMode: mode,
          })
        )
      );
      setConfirmed(true);
    } finally {
      setAssigning(false);
    }
  };

  const assignedUnitTitle =
    previewUnitData?.title ??
    units.find((u) => u.id === assignUnit)?.title ??
    "Unit";

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Assign Lessons"
        subtitle="Browse Edventures, preview the content, and assign to your classes"
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-3xl bg-charcoal/8" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {units.map((u) => (
            <div key={u.id} className="space-y-2">
              <div onClick={() => setPreviewUnit(u.id)} className="cursor-pointer">
                <UnitCard unit={u} href="#" />
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" className="flex-1" onClick={() => setPreviewUnit(u.id)}>
                  Preview
                </Button>
                <Button size="sm" className="flex-1" onClick={() => openAssign(u.id)}>
                  Assign
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview modal */}
      <Modal
        open={!!previewUnit}
        onClose={() => setPreviewUnit(null)}
        title={previewUnitData?.title ?? "Loading..."}
        maxWidth="max-w-2xl"
      >
        {previewLoading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-charcoal/8" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-charcoal-soft">{previewUnitData?.description}</p>
            {previewTopics.map((t) => (
              <div key={t.id} className="rounded-2xl bg-cream/60 p-4">
                <div className="flex items-center justify-between">
                  <h4 className="display font-bold text-forest-900">{t.title}</h4>
                  <Badge tone="sand">{t.difficulty}</Badge>
                </div>
                <p className="mt-1 text-sm text-charcoal-soft">{t.description}</p>
                <div className="mt-2 space-y-1">
                  {t.videos.map((v) => (
                    <div key={v.id} className="flex items-center gap-2 text-sm text-charcoal">
                      <Film className="h-4 w-4 text-forest-600" aria-hidden /> {v.title}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {previewUnit && (
              <Button className="w-full" onClick={() => openAssign(previewUnit)}>
                Assign this unit
              </Button>
            )}
          </div>
        )}
      </Modal>

      {/* Assign modal */}
      <Modal
        open={!!assignUnit}
        onClose={() => setAssignUnit(null)}
        title="Assign lesson"
        maxWidth="max-w-lg"
      >
        {confirmed ? (
          <div className="text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-forest-50 text-3xl"></div>
            <h3 className="display mt-3 text-lg font-bold text-forest-900">Lesson assigned!</h3>
            <p className="mt-1 text-sm text-charcoal-soft">
              {assignedUnitTitle} is now available to {selectedClasses.length}{" "}
              {selectedClasses.length === 1 ? "class" : "classes"}.
            </p>
            {mode === "teacher-led" && (
              <div className="mt-4 rounded-2xl border border-forest-200 bg-forest-50 px-4 py-3 text-left">
                <div className="flex items-start gap-3">
                  <Printer className="mt-0.5 h-5 w-5 shrink-0 text-forest-700" aria-hidden />
                  <div>
                    <p className="text-sm font-semibold text-forest-900">Print worksheets before class</p>
                    <p className="mt-0.5 text-xs text-charcoal-soft">
                      Teacher-led mode works best with printed worksheets students complete during the session.
                    </p>
                    <Link href="/admin/resources" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-forest-700 hover:underline" onClick={() => setAssignUnit(null)}>
                      Go to Resources to print worksheets →
                    </Link>
                  </div>
                </div>
              </div>
            )}
            <Button className="mt-4" onClick={() => setAssignUnit(null)}>Done</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-semibold text-forest-900">Choose classes</p>
              <div className="space-y-2">
                {classes.map((c) => (
                  <label
                    key={c.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-3 ${
                      selectedClasses.includes(c.id) ? "border-forest-600 bg-forest-50" : "border-sand"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedClasses.includes(c.id)}
                      onChange={() => toggle(selectedClasses, c.id, setSelectedClasses)}
                    />
                    <span className="text-sm font-semibold text-forest-900">{c.name}</span>
                    <Badge tone="sand" className="ml-auto">{c.yearGroup}</Badge>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-forest-900">Topics to include</p>
              <div className="flex flex-wrap gap-2">
                {assignTopics.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => toggle(selectedTopics, t.id, setSelectedTopics)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      selectedTopics.includes(t.id)
                        ? "bg-forest-700 text-cream"
                        : "bg-forest-50 text-forest-700"
                    }`}
                  >
                    {t.title}
                  </button>
                ))}
              </div>
            </div>

            <FormField label="Due date">
              <input
                type="date"
                className={inputClass}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </FormField>

            {/* Delivery mode */}
            <div>
              <p className="mb-2 text-sm font-semibold text-forest-900">How will they learn?</p>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    {
                      m: "student-led" as const,
                      Icon: Tablet,
                      t: "Student-led",
                      d: "Each student on a device, self-paced and adaptive.",
                    },
                    {
                      m: "teacher-led" as const,
                      Icon: MonitorPlay,
                      t: "Teacher-led",
                      d: "One screen for the class, no devices needed.",
                    },
                  ] as const
                ).map((o) => (
                  <button
                    key={o.m}
                    type="button"
                    onClick={() => setMode(o.m)}
                    className={`rounded-2xl border-2 p-3 text-left transition-all ${
                      mode === o.m
                        ? "border-forest-600 bg-forest-50 shadow-soft"
                        : "border-sand hover:border-forest-400"
                    }`}
                  >
                    <o.Icon className="h-5 w-5 text-forest-700" aria-hidden />
                    <p className="mt-1 text-sm font-semibold text-forest-900">{o.t}</p>
                    <p className="mt-0.5 text-xs text-charcoal-soft">{o.d}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <ToggleRow
                label="Adaptive tasks"
                desc="Auto-assign support/core/extension tasks"
                value={adaptive}
                onChange={setAdaptive}
              />
              <ToggleRow
                label="Explorer points"
                desc="Students earn points for completing work"
                value={points}
                onChange={setPoints}
              />
            </div>

            <Button
              className="w-full"
              onClick={doAssign}
              disabled={selectedClasses.length === 0 || assigning}
            >
              {assigning
                ? "Assigning..."
                : `Assign to ${selectedClasses.length || "..."} ${selectedClasses.length === 1 ? "class" : "classes"}`}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}

function ToggleRow({
  label,
  desc,
  value,
  onChange,
}: {
  label: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-cream/60 px-4 py-3">
      <div className="flex-1">
        <p className="text-sm font-semibold text-forest-900">{label}</p>
        <p className="text-xs text-charcoal-soft">{desc}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          value ? "bg-forest-600" : "bg-charcoal/20"
        }`}
        aria-pressed={value}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            value ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export default function AssignPage() {
  return (
    <Suspense fallback={<div className="p-8 text-charcoal-soft">Loading Edventures...</div>}>
      <AssignInner />
    </Suspense>
  );
}

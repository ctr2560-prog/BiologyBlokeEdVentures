"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { SectionHeader, Button, Modal, Badge, EmptyState } from "@/components/ui/primitives";
import { UnitForm } from "@/components/forms/ContentForms";
import {
  getUnits, getTopicsByUnit, getTopics,
  addLessonToUnit, removeLessonFromUnit, updateUnit,
} from "@/lib/supabaseService";
import {
  Leaf, ChevronUp, ChevronDown, Plus, Film, CircleHelp,
  Loader, BookOpen, X, Save, Check,
} from "lucide-react";
import type { Unit, Topic } from "@/types";

export default function UnitsPage() {
  const [units, setUnits]             = useState<Unit[]>([]);
  const [loading, setLoading]         = useState(true);
  const [expandedUnit, setExpanded]   = useState<string | null>(null);
  const [unitLessons, setUnitLessons] = useState<Record<string, Topic[]>>({});
  const [lessonsLoading, setLessonsLoading] = useState<Record<string, boolean>>({});

  const [createUnitOpen, setCreateUnitOpen] = useState(false);
  const [pickerFor, setPickerFor]           = useState<Unit | null>(null);
  const [allLessons, setAllLessons]         = useState<Topic[]>([]);
  const [pickerLoading, setPickerLoading]   = useState(false);

  // Per-unit inline draft state for program + assessment task
  const [programs, setPrograms]         = useState<Record<string, string>>({});
  const [assessments, setAssessments]   = useState<Record<string, string>>({});
  const [savedSection, setSavedSection] = useState<Record<string, string>>({});
  const [savingUnit, setSavingUnit]     = useState<string | null>(null);

  const loadUnits = useCallback(async () => {
    const data = await getUnits();
    setUnits(data);
    setLoading(false);
  }, []);

  useEffect(() => { loadUnits(); }, [loadUnits]);

  const toggleUnit = async (unit: Unit) => {
    const isOpen = expandedUnit === unit.id;
    setExpanded(isOpen ? null : unit.id);
    if (!isOpen) {
      // Initialise draft state for inline editors the first time
      if (programs[unit.id] === undefined) {
        setPrograms((p) => ({ ...p, [unit.id]: unit.program ?? "" }));
        setAssessments((p) => ({ ...p, [unit.id]: unit.assessmentTask ?? "" }));
      }
      if (!unitLessons[unit.id]) {
        setLessonsLoading((p) => ({ ...p, [unit.id]: true }));
        const lessons = await getTopicsByUnit(unit.id);
        setUnitLessons((p) => ({ ...p, [unit.id]: lessons }));
        setLessonsLoading((p) => ({ ...p, [unit.id]: false }));
      }
    }
  };

  const refreshUnitLessons = async (unitId: string) => {
    const lessons = await getTopicsByUnit(unitId);
    setUnitLessons((p) => ({ ...p, [unitId]: lessons }));
  };

  const openPicker = async (unit: Unit) => {
    setPickerFor(unit);
    setPickerLoading(true);
    const all = await getTopics();
    setAllLessons(all);
    setPickerLoading(false);
  };

  const handleAddLesson = async (lesson: Topic) => {
    if (!pickerFor) return;
    const current = unitLessons[pickerFor.id] ?? [];
    await addLessonToUnit(pickerFor.id, lesson.id, current.length);
    await refreshUnitLessons(pickerFor.id);
    setPickerFor(null);
  };

  const handleRemoveLesson = async (unitId: string, lessonId: string) => {
    await removeLessonFromUnit(unitId, lessonId);
    setUnitLessons((p) => ({
      ...p,
      [unitId]: (p[unitId] ?? []).filter((l) => l.id !== lessonId),
    }));
  };

  const handleSaveContent = async (unitId: string) => {
    setSavingUnit(unitId);
    setSavedSection((p) => ({ ...p, [unitId]: "" }));
    try {
      const updated = await updateUnit(unitId, {
        program: programs[unitId] ?? "",
        assessmentTask: assessments[unitId] ?? "",
      });
      setUnits((prev) => prev.map((u) => (u.id === unitId ? updated : u)));
      setSavedSection((p) => ({ ...p, [unitId]: "saved" }));
      setTimeout(() => setSavedSection((p) => ({ ...p, [unitId]: "" })), 2000);
    } finally {
      setSavingUnit(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader className="h-8 w-8 animate-spin text-forest-600" aria-hidden />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Units"
        subtitle="Units group lessons into curriculum sequences. Create lessons independently from the Lessons page."
        action={
          <Button onClick={() => setCreateUnitOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden /> Create unit
          </Button>
        }
      />

      {units.length === 0 ? (
        <EmptyState
          Icon={BookOpen}
          title="No units yet"
          message="Create your first unit to start organising your lessons."
          action={
            <Button onClick={() => setCreateUnitOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden /> Create unit
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {units.map((unit) => {
            const open      = expandedUnit === unit.id;
            const lessons   = unitLessons[unit.id] ?? [];
            const isLoading = lessonsLoading[unit.id];
            const isSaving  = savingUnit === unit.id;
            const justSaved = savedSection[unit.id] === "saved";

            return (
              <div
                key={unit.id}
                className="overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-black/5"
              >
                {/* Unit header */}
                <button
                  onClick={() => toggleUnit(unit)}
                  className="flex w-full items-center gap-4 p-5 text-left"
                >
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-forest-50 text-forest-700">
                    <Leaf className="h-6 w-6" aria-hidden />
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
                    {unit.yearGroups.length > 0 && (
                      <span>{unit.yearGroups.join(", ")}</span>
                    )}
                    {open ? (
                      <ChevronUp className="h-5 w-5" aria-hidden />
                    ) : (
                      <ChevronDown className="h-5 w-5" aria-hidden />
                    )}
                  </div>
                </button>

                {/* Expanded body */}
                {open && (
                  <div className="border-t border-sand bg-cream/40 p-5 space-y-6">

                    {/* Syllabus outcomes */}
                    {unit.outcomes.length > 0 && (
                      <div>
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-charcoal-soft">
                          Syllabus outcomes
                        </p>
                        <ul className="text-sm text-charcoal">
                          {unit.outcomes.map((o) => <li key={o}>- {o}</li>)}
                        </ul>
                      </div>
                    )}

                    {/* Lessons */}
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-semibold text-forest-900">Lessons in this unit</p>
                        <Button size="sm" variant="secondary" onClick={() => openPicker(unit)}>
                          <Plus className="h-3.5 w-3.5" aria-hidden /> Add lesson
                        </Button>
                      </div>

                      {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader className="h-6 w-6 animate-spin text-forest-600" aria-hidden />
                        </div>
                      ) : lessons.length === 0 ? (
                        <div className="rounded-2xl border-2 border-dashed border-sand-dark bg-cream/50 px-4 py-6 text-center text-sm text-charcoal-soft">
                          No lessons allocated yet. Click "Add lesson" to pick from the lesson library.
                        </div>
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {lessons.map((lesson) => (
                            <div
                              key={lesson.id}
                              className="flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-sand"
                            >
                              <div className="flex items-start gap-2">
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-forest-900 leading-tight">
                                    {lesson.title}
                                  </p>
                                  {lesson.description && (
                                    <p className="mt-0.5 line-clamp-2 text-xs text-charcoal-soft">
                                      {lesson.description}
                                    </p>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleRemoveLesson(unit.id, lesson.id)}
                                  className="shrink-0 p-1 text-charcoal-soft hover:text-clay-600"
                                  aria-label="Remove from unit"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-charcoal-soft">
                                <span className="flex items-center gap-1">
                                  <Film className="h-3.5 w-3.5" aria-hidden />
                                  {lesson.videoIds.length}
                                </span>
                                <span className="flex items-center gap-1">
                                  <CircleHelp className="h-3.5 w-3.5" aria-hidden />
                                  {lesson.quizIds.length}
                                </span>
                                <Badge
                                  tone={
                                    lesson.difficulty === "foundation" ? "clay"
                                    : lesson.difficulty === "advanced" ? "mist"
                                    : "forest"
                                  }
                                  className="ml-auto"
                                >
                                  {lesson.difficulty}
                                </Badge>
                              </div>
                              <Link
                                href={`/admin/lessons/${lesson.id}`}
                                className="block w-full rounded-full bg-forest-700 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-forest-800 transition-colors"
                              >
                                Build lesson
                              </Link>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="border-t border-sand" />

                    {/* Unit Program + Assessment Task */}
                    <div className="grid gap-5 md:grid-cols-2">

                      {/* Unit Program */}
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-forest-900">
                          Unit program
                        </label>
                        <p className="text-xs text-charcoal-soft">
                          Outline the scope and sequence of this unit.
                        </p>
                        <textarea
                          rows={8}
                          value={programs[unit.id] ?? ""}
                          onChange={(e) =>
                            setPrograms((p) => ({ ...p, [unit.id]: e.target.value }))
                          }
                          className="w-full rounded-2xl border border-sand-dark bg-white px-4 py-3 text-sm text-charcoal placeholder:text-charcoal-soft/60 focus:border-forest-400 focus:outline-none focus:ring-2 focus:ring-forest-200"
                          placeholder={"Week 1 - Introduction to ecosystems&#10;Week 2 - Food webs and energy flow&#10;..."}
                        />
                      </div>

                      {/* Assessment Task Notification */}
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-forest-900">
                          Assessment task notification
                        </label>
                        <p className="text-xs text-charcoal-soft">
                          Details of the summative task sent to students and parents.
                        </p>
                        <textarea
                          rows={8}
                          value={assessments[unit.id] ?? ""}
                          onChange={(e) =>
                            setAssessments((p) => ({ ...p, [unit.id]: e.target.value }))
                          }
                          className="w-full rounded-2xl border border-sand-dark bg-white px-4 py-3 text-sm text-charcoal placeholder:text-charcoal-soft/60 focus:border-forest-400 focus:outline-none focus:ring-2 focus:ring-forest-200"
                          placeholder={"Task title: Ecosystem Inquiry Report&#10;Due: Week 8&#10;&#10;Students will investigate a local ecosystem..."}
                        />
                      </div>
                    </div>

                    {/* Save content button */}
                    <div className="flex items-center justify-end gap-3">
                      {justSaved && (
                        <span className="flex items-center gap-1.5 text-sm font-semibold text-forest-700">
                          <Check className="h-4 w-4" /> Saved
                        </span>
                      )}
                      <Button
                        size="sm"
                        onClick={() => handleSaveContent(unit.id)}
                        disabled={isSaving}
                      >
                        <Save className="h-3.5 w-3.5" aria-hidden />
                        {isSaving ? "Saving..." : "Save unit content"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create unit modal */}
      <Modal open={createUnitOpen} onClose={() => setCreateUnitOpen(false)} title="Create unit" maxWidth="max-w-2xl">
        <UnitForm
          onSaved={(unit) => {
            setUnits((prev) => [...prev, unit]);
            setCreateUnitOpen(false);
          }}
        />
      </Modal>

      {/* Lesson picker modal */}
      <Modal
        open={!!pickerFor}
        onClose={() => setPickerFor(null)}
        title={pickerFor ? `Add lesson to "${pickerFor.title}"` : "Add lesson"}
        maxWidth="max-w-xl"
      >
        {pickerLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader className="h-6 w-6 animate-spin text-forest-600" aria-hidden />
          </div>
        ) : (() => {
          const alreadyIn = new Set((unitLessons[pickerFor?.id ?? ""] ?? []).map((l) => l.id));
          const available = allLessons.filter((l) => !alreadyIn.has(l.id));
          return available.length === 0 ? (
            <div className="space-y-3 text-center py-6">
              <p className="text-sm text-charcoal-soft">All lessons are already in this unit.</p>
              <Link
                href="/admin/lessons"
                className="inline-block text-sm font-semibold text-forest-700 hover:underline"
                onClick={() => setPickerFor(null)}
              >
                Go to Lessons to create a new one
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-charcoal-soft mb-3">
                Select a lesson to add to this unit.
              </p>
              {available.map((lesson) => (
                <button
                  key={lesson.id}
                  onClick={() => handleAddLesson(lesson)}
                  className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left ring-1 ring-sand hover:bg-forest-50 hover:ring-forest-300 transition-colors"
                >
                  <BookOpen className="h-4 w-4 shrink-0 text-forest-600" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-charcoal">{lesson.title}</p>
                    {lesson.description && (
                      <p className="truncate text-xs text-charcoal-soft">{lesson.description}</p>
                    )}
                  </div>
                  <Badge
                    tone={
                      lesson.difficulty === "foundation" ? "clay"
                      : lesson.difficulty === "advanced" ? "mist"
                      : "forest"
                    }
                  >
                    {lesson.difficulty}
                  </Badge>
                </button>
              ))}
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}

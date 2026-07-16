"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Modal, Badge, EmptyState, inputClass } from "@/components/ui/primitives";
import { UnitForm } from "@/components/forms/ContentForms";
import { CoverImageControl } from "@/components/forms/CoverImageControl";
import {
  getUnits, getTopics, getTopicsByUnit,
  addLessonToUnit, removeLessonFromUnit, deleteUnit, createTopic, deleteTopic,
  setUnitFeatured,
  uploadUnitDocument, setUnitDocument, unitDocFilename,
  type UnitDocKind,
} from "@/lib/supabaseService";
import {
  Layers, BookOpen, Film, CircleHelp, Plus, ChevronDown, ChevronRight,
  Trash2, Loader, ArrowRight, FolderPlus, PenLine, X, Star,
  FileText, Upload, Download,
} from "lucide-react";
import type { Unit, Topic } from "@/types";

// ── Unit document slot (Word downloads for teachers) ──────────────────────────

function UnitDocSlot({
  unitId,
  kind,
  label,
  initialUrl,
}: {
  unitId: string;
  kind: UnitDocKind;
  label: string;
  initialUrl: string;
}) {
  const [url, setUrl] = useState(initialUrl.startsWith("http") ? initialUrl : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setBusy(true);
    setError("");
    try {
      const publicUrl = await uploadUnitDocument(unitId, kind, file);
      await setUnitDocument(unitId, kind, publicUrl);
      setUrl(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    setBusy(true);
    try {
      await setUnitDocument(unitId, kind, "");
      setUrl("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-sand">
      <input
        ref={fileRef}
        type="file"
        accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleUpload(f);
        }}
      />
      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${url ? "bg-mist-100" : "bg-sand"}`}>
        <FileText className={`h-5 w-5 ${url ? "text-mist-600" : "text-charcoal-soft/50"}`} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-forest-900">{label}</p>
        {url ? (
          <p className="truncate text-[11px] text-charcoal-soft">{unitDocFilename(url)}</p>
        ) : (
          <p className="text-[11px] text-charcoal-soft/60">No document yet — upload a Word file</p>
        )}
        {error && <p className="text-[11px] text-clay-600">{error}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {url && (
          <a
            href={url}
            download
            className="rounded-lg p-1.5 text-charcoal-soft transition-colors hover:bg-forest-50 hover:text-forest-700"
            aria-label={`Download ${label}`}
          >
            <Download className="h-4 w-4" />
          </a>
        )}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="flex items-center gap-1.5 rounded-full border border-sand-dark bg-white px-3 py-1.5 text-[11px] font-bold text-charcoal transition-colors hover:bg-cream disabled:opacity-50"
        >
          {busy ? <Loader className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
          {url ? "Replace" : "Upload"}
        </button>
        {url && (
          <button
            onClick={handleRemove}
            disabled={busy}
            className="rounded-lg p-1.5 text-clay-400 transition-colors hover:bg-clay-400/10 hover:text-clay-600"
            aria-label={`Remove ${label}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── New lesson modal ──────────────────────────────────────────────────────────

function NewLessonModal({
  unitId,
  unitTitle,
  lessonCount,
  onClose,
}: {
  unitId: string | null;
  unitTitle: string;
  lessonCount: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError("");
    try {
      const lesson = await createTopic({ title: title.trim(), description: description.trim(), difficulty: "core" });
      if (unitId) await addLessonToUnit(unitId, lesson.id, lessonCount);
      router.push(`/admin/lessons/${lesson.id}`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create lesson");
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="New lesson" maxWidth="max-w-md">
      <form onSubmit={submit} className="space-y-5">
        <div className="flex items-center gap-4 rounded-2xl bg-forest-50 px-4 py-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-forest-100">
            <BookOpen className="h-5 w-5 text-forest-700" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-semibold text-forest-900">New lesson</p>
            <p className="text-xs text-charcoal-soft">
              {unitId
                ? `Will be added to "${unitTitle}"`
                : "Standalone — can be assigned directly to a class"}
            </p>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-forest-900">
            Title <span className="font-normal text-clay-500">*</span>
          </label>
          <input
            autoFocus
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Coral Reef Ecosystems"
            className={`${inputClass} w-full`}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-forest-900">
            Description{" "}
            <span className="font-normal text-charcoal-soft">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What will students discover in this lesson?"
            rows={2}
            className={`${inputClass} w-full resize-none`}
          />
        </div>

        {error && (
          <p className="rounded-2xl bg-clay-400/10 px-4 py-3 text-sm font-medium text-clay-600">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-sand-dark bg-white px-4 py-2.5 text-sm font-semibold text-charcoal hover:bg-cream transition-colors"
          >
            Cancel
          </button>
          <Button type="submit" disabled={saving || !title.trim()} className="flex-1">
            {saving ? "Creating…" : "Create & build"}
            {!saving && <ArrowRight className="h-4 w-4" />}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Lesson card ───────────────────────────────────────────────────────────────

function LessonCard({
  lesson,
  onRemove,
  onDelete,
}: {
  lesson: Topic;
  onRemove?: () => void;
  onDelete?: () => void;
}) {
  const videoCount = lesson.videoIds.length;
  const quizCount  = lesson.quizIds.length;

  return (
    <div className="group relative flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-sand hover:ring-forest-200 transition-all hover:shadow-sm">
      <div className="flex items-start gap-2">
        <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-forest-500" aria-hidden />
        <p className="flex-1 text-sm font-semibold leading-snug text-forest-900">{lesson.title}</p>
        {onRemove && (
          <button
            onClick={onRemove}
            title="Remove from unit (keeps the lesson)"
            className="shrink-0 p-0.5 text-charcoal-soft opacity-0 group-hover:opacity-100 hover:text-clay-600 transition-all"
            aria-label="Remove from unit"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            title="Delete lesson"
            className="shrink-0 p-0.5 text-charcoal-soft opacity-0 group-hover:opacity-100 hover:text-clay-600 transition-all"
            aria-label="Delete lesson"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 text-xs text-charcoal-soft">
        <span className="flex items-center gap-1">
          <Film className="h-3 w-3" aria-hidden />
          {videoCount} video{videoCount !== 1 ? "s" : ""}
        </span>
        <span className="flex items-center gap-1">
          <CircleHelp className="h-3 w-3" aria-hidden />
          {quizCount} quiz{quizCount !== 1 ? "zes" : ""}
        </span>
      </div>

      <Link
        href={`/admin/lessons/${lesson.id}`}
        className="flex items-center justify-center gap-1.5 rounded-full bg-forest-700 px-4 py-2 text-xs font-bold text-white hover:bg-forest-800 transition-colors"
      >
        Build lesson <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

// ── Unit accordion ────────────────────────────────────────────────────────────

function UnitAccordion({
  unit,
  onDelete,
}: {
  unit: Unit;
  onDelete: (id: string) => void;
}) {
  const router = useRouter();
  const [open, setOpen]               = useState(false);
  const [featured, setFeatured]       = useState(unit.featured);
  const [lessons, setLessons]         = useState<Topic[]>([]);
  const [loaded, setLoaded]           = useState(false);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [addingLesson, setAddingLesson]     = useState(false);
  const [showPicker, setShowPicker]         = useState(false);
  const [allLessons, setAllLessons]         = useState<Topic[]>([]);
  const [pickerLoading, setPickerLoading]   = useState(false);

  const loadLessons = useCallback(async () => {
    setLoadingLessons(true);
    const data = await getTopicsByUnit(unit.id);
    setLessons(data);
    setLoaded(true);
    setLoadingLessons(false);
  }, [unit.id]);

  const handleToggle = () => {
    setOpen((o) => {
      if (!o && !loaded) loadLessons();
      return !o;
    });
  };

  const handleLessonCreated = () => {
    setAddingLesson(false);
  };

  const handleRemoveLesson = async (lessonId: string) => {
    await removeLessonFromUnit(unit.id, lessonId);
    setLessons((prev) => prev.filter((l) => l.id !== lessonId));
  };

  const handleDeleteLesson = async (lesson: Topic) => {
    if (!confirm(`Delete lesson "${lesson.title}"? Its sequence and linked activities go with it. This cannot be undone.`)) return;
    try {
      await deleteTopic(lesson.id);
      setLessons((prev) => prev.filter((l) => l.id !== lesson.id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed.");
    }
  };

  const handleToggleFeatured = async () => {
    const next = !featured;
    setFeatured(next);
    try {
      await setUnitFeatured(unit.id, next);
    } catch {
      setFeatured(!next);
    }
  };

  const handleDeleteUnit = async () => {
    if (!confirm(
      `Delete unit "${unit.title}"? Class assignments of this unit are removed too. ` +
      `Its lessons are kept and become standalone. This cannot be undone.`
    )) return;
    try {
      await deleteUnit(unit.id);
      onDelete(unit.id);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed — this unit may still have content linked to it.");
    }
  };

  const openPicker = async () => {
    setShowPicker(true);
    setPickerLoading(true);
    const all = await getTopics();
    setAllLessons(all);
    setPickerLoading(false);
  };

  const handlePickLesson = async (lesson: Topic) => {
    await addLessonToUnit(unit.id, lesson.id, lessons.length);
    setLessons((prev) => [...prev, lesson]);
    setShowPicker(false);
  };

  const lessonIdsInUnit = new Set(lessons.map((l) => l.id));
  const pickable = allLessons.filter((l) => !lessonIdsInUnit.has(l.id));

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-black/5">
      {/* Unit header */}
      <div className="flex items-center gap-3 pr-4">
        <button
          onClick={handleToggle}
          className="flex flex-1 items-center gap-4 p-5 text-left"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-forest-50 text-forest-700">
            <Layers className="h-6 w-6" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="display text-lg font-bold text-forest-900">{unit.title}</h3>
              {unit.stage && <Badge tone="gold">{unit.stage}</Badge>}
              {!unit.published && <Badge tone="neutral">Draft</Badge>}
            </div>
            {unit.description && (
              <p className="mt-0.5 line-clamp-1 text-sm text-charcoal-soft">{unit.description}</p>
            )}
          </div>
          <div className="hidden shrink-0 items-center gap-3 text-sm text-charcoal-soft sm:flex">
            {unit.yearGroups.length > 0 && (
              <span>{unit.yearGroups.join(", ")}</span>
            )}
            {open
              ? <ChevronDown className="h-5 w-5" aria-hidden />
              : <ChevronRight className="h-5 w-5" aria-hidden />
            }
          </div>
        </button>
        <button
          onClick={handleToggleFeatured}
          title={featured ? "Remove from featured" : "Feature on teacher dashboard"}
          className={`shrink-0 rounded-xl p-2 transition-colors ${
            featured
              ? "text-gold-500 hover:bg-gold-300/20"
              : "text-charcoal-soft/40 hover:bg-gold-300/20 hover:text-gold-500"
          }`}
          aria-label={featured ? "Remove from featured" : "Add to featured"}
        >
          <Star className={`h-4 w-4 ${featured ? "fill-gold-500" : ""}`} />
        </button>
        <button
          onClick={handleDeleteUnit}
          className="shrink-0 rounded-xl p-2 text-charcoal-soft hover:bg-clay-400/10 hover:text-clay-600 transition-colors"
          aria-label="Delete unit"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Expanded content */}
      {open && (
        <div className="border-t border-sand bg-cream/30 p-5 space-y-4">
          {loadingLessons ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="h-6 w-6 animate-spin text-forest-600" />
            </div>
          ) : (
            <>
              {/* Cover image for teacher library cards */}
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-charcoal-soft">
                  Cover image
                </p>
                <div className="max-w-md">
                  <CoverImageControl
                    kind="unit"
                    id={unit.id}
                    initialUrl={unit.coverImage ?? ""}
                    compact
                  />
                </div>
              </div>

              {/* Teacher downloads: unit program + assessment task */}
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-charcoal-soft">
                  Teacher downloads
                </p>
                <div className="grid gap-2 md:grid-cols-2">
                  <UnitDocSlot
                    unitId={unit.id}
                    kind="program"
                    label="Unit program"
                    initialUrl={unit.program ?? ""}
                  />
                  <UnitDocSlot
                    unitId={unit.id}
                    kind="assessment"
                    label="Assessment task"
                    initialUrl={unit.assessmentTask ?? ""}
                  />
                </div>
              </div>

              {/* Lessons grid */}
              {lessons.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {lessons.map((lesson) => (
                    <LessonCard
                      key={lesson.id}
                      lesson={lesson}
                      onRemove={() => handleRemoveLesson(lesson.id)}
                      onDelete={() => handleDeleteLesson(lesson)}
                    />
                  ))}
                </div>
              )}

              {/* Action row */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setAddingLesson(true)}
                  className="flex items-center gap-1.5 rounded-full bg-forest-700 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-800 transition-colors"
                >
                  <Plus className="h-4 w-4" aria-hidden /> New lesson
                </button>
                <button
                  onClick={openPicker}
                  className="flex items-center gap-1.5 rounded-full border border-sand-dark bg-white px-4 py-2 text-sm font-semibold text-charcoal hover:bg-cream transition-colors"
                >
                  <PenLine className="h-4 w-4" aria-hidden /> Add existing
                </button>
              </div>

              {/* New lesson modal */}
              {addingLesson && (
                <NewLessonModal
                  unitId={unit.id}
                  unitTitle={unit.title}
                  lessonCount={lessons.length}
                  onClose={handleLessonCreated}
                />
              )}

              {/* Empty state when no lessons */}
              {lessons.length === 0 && (
                <div className="rounded-2xl border-2 border-dashed border-sand-dark bg-cream/50 py-8 text-center">
                  <BookOpen className="mx-auto mb-2 h-7 w-7 text-sand-dark" aria-hidden />
                  <p className="text-sm text-charcoal-soft">No lessons in this unit yet.</p>
                  <p className="mt-0.5 text-xs text-charcoal-soft/70">Click "New lesson" to build your first one.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Add existing lesson picker */}
      <Modal
        open={showPicker}
        onClose={() => setShowPicker(false)}
        title={`Add lesson to "${unit.title}"`}
        maxWidth="max-w-lg"
      >
        {pickerLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader className="h-6 w-6 animate-spin text-forest-600" />
          </div>
        ) : pickable.length === 0 ? (
          <p className="py-6 text-center text-sm text-charcoal-soft">
            No standalone lessons available to add.
          </p>
        ) : (
          <div className="space-y-2">
            {pickable.map((lesson) => (
              <button
                key={lesson.id}
                onClick={() => handlePickLesson(lesson)}
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 ring-1 ring-sand hover:bg-forest-50 hover:ring-forest-300 transition-colors"
              >
                <BookOpen className="h-4 w-4 shrink-0 text-forest-600" />
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate text-sm font-semibold text-charcoal">{lesson.title}</p>
                  <p className="text-xs text-charcoal-soft">
                    {lesson.videoIds.length} video{lesson.videoIds.length !== 1 ? "s" : ""} · {lesson.quizIds.length} quiz{lesson.quizIds.length !== 1 ? "zes" : ""}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-charcoal-soft" />
              </button>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ContentPage() {
  const [units, setUnits]             = useState<Unit[]>([]);
  const [standalone, setStandalone]   = useState<Topic[]>([]);
  const [loading, setLoading]         = useState(true);
  const [createUnitOpen, setCreateUnitOpen] = useState(false);
  const [addingStandalone, setAddingStandalone] = useState(false);
  const router = useRouter();

  const load = useCallback(async () => {
    const [unitData, allTopics] = await Promise.all([getUnits(), getTopics()]);
    setUnits(unitData);
    // We'll compute standalone lazily — for now just show all topics as potentially standalone
    // (the unit accordions manage their own lesson lists)
    setStandalone(allTopics);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUnitDeleted = (id: string) => {
    setUnits((prev) => prev.filter((u) => u.id !== id));
  };

  const handleDeleteStandalone = async (lesson: Topic) => {
    if (!confirm(`Delete lesson "${lesson.title}"? Its sequence and linked activities go with it. This cannot be undone.`)) return;
    try {
      await deleteTopic(lesson.id);
      setStandalone((prev) => prev.filter((l) => l.id !== lesson.id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed.");
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader className="h-8 w-8 animate-spin text-forest-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="display text-2xl font-bold text-forest-900 md:text-3xl">Content</h1>
          <p className="mt-1 text-sm text-charcoal-soft">
            Build units and lessons. Teachers can assign any individual lesson to their class.
          </p>
        </div>
        <Button onClick={() => setCreateUnitOpen(true)}>
          <FolderPlus className="h-4 w-4" aria-hidden /> New unit
        </Button>
      </div>

      {/* Units */}
      {units.length === 0 && !loading ? (
        <EmptyState
          Icon={Layers}
          title="No units yet"
          message="Create your first unit to start organising your lessons."
          action={
            <Button onClick={() => setCreateUnitOpen(true)}>
              <FolderPlus className="h-4 w-4" aria-hidden /> New unit
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {units.map((unit) => (
            <UnitAccordion
              key={unit.id}
              unit={unit}
              onDelete={handleUnitDeleted}
            />
          ))}
        </div>
      )}

      {/* Standalone lessons */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="display text-lg font-bold text-forest-900">Standalone lessons</h2>
            <p className="text-xs text-charcoal-soft">Lessons not inside a unit — can still be assigned individually by teachers.</p>
          </div>
        </div>

        <div className="space-y-3">
          {standalone.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {standalone.map((lesson) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  onDelete={() => handleDeleteStandalone(lesson)}
                />
              ))}
            </div>
          )}

          <button
            onClick={() => setAddingStandalone(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-sand-dark bg-white py-4 text-sm font-semibold text-charcoal-soft hover:border-forest-300 hover:bg-forest-50 hover:text-forest-700 transition-colors"
          >
            <Plus className="h-4 w-4" /> New standalone lesson
          </button>

          {addingStandalone && (
            <NewLessonModal
              unitId={null}
              unitTitle=""
              lessonCount={0}
              onClose={() => setAddingStandalone(false)}
            />
          )}
        </div>
      </div>

      {/* Create unit modal */}
      <Modal open={createUnitOpen} onClose={() => setCreateUnitOpen(false)} title="New unit" maxWidth="max-w-2xl">
        <UnitForm
          onSaved={(unit) => {
            setUnits((prev) => [...prev, unit]);
            setCreateUnitOpen(false);
          }}
        />
      </Modal>
    </div>
  );
}


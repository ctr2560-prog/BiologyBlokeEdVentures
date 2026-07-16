"use client";
/*
 * Admin content-authoring forms. All forms write to Supabase.
 * Forms accept optional locked* props so they can be used in topic-context
 * (where topic/unit are already known) without showing the dropdowns.
 */
import { useEffect, useState } from "react";
import { UploadCloud, X, Check, Plus, BookOpen, Pencil } from "lucide-react";
import {
  FormField,
  inputClass,
  Button,
  Badge,
} from "@/components/ui/primitives";
import {
  createUnit,
  createTopic,
  createResource,
  createQuiz,
  updateQuiz,
  getTopics,
  addLessonToUnit,
} from "@/lib/supabaseService";
import type {
  Stage,
  ResourceType,
  Difficulty,
  QuestionType,
  Question,
  Quiz,
  Topic,
  Unit,
} from "@/types";

const STAGES: Stage[] = ["Stage 3", "Stage 4", "Stage 5"];
const DIFFICULTIES: Difficulty[] = ["foundation", "core", "advanced"];

// ---- Unit form ----
export function UnitForm({ onSaved }: { onSaved: (unit: Unit) => void }) {
  const [title, setTitle]           = useState("");
  const [stage, setStage]           = useState<Stage>("Stage 3");
  const [yearGroups, setYearGroups] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration]     = useState(10);
  const [outcomes, setOutcomes]     = useState("");
  const [published, setPublished]   = useState(false);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");

  // Lesson picker
  const [allLessons, setAllLessons]           = useState<Topic[]>([]);
  const [lessonsLoading, setLessonsLoading]   = useState(true);
  const [selectedLessonIds, setSelectedLessonIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    getTopics().then((t) => { setAllLessons(t); setLessonsLoading(false); });
  }, []);

  const toggleLesson = (id: string) => {
    setSelectedLessonIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const unit = await createUnit({
        title,
        stage,
        yearGroups: yearGroups.split(",").map((y) => y.trim()).filter(Boolean),
        description,
        durationLessons: duration,
        outcomes: outcomes.split("\n").map((o) => o.trim()).filter(Boolean),
        topicIds: [],
        coverImage: "/trees.png",
        coverEmoji: "",
        published,
        featured: false,
        program: "",
        assessmentTask: "",
      });
      // Allocate selected lessons in order
      const selected = allLessons.filter((l) => selectedLessonIds.has(l.id));
      for (let i = 0; i < selected.length; i++) {
        await addLessonToUnit(unit.id, selected[i].id, i);
      }
      onSaved(unit);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create unit");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      {/* Basic details */}
      <FormField label="Unit title" required>
        <input
          className={inputClass}
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Australian Ecosystems"
        />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Stage">
          <select
            className={inputClass}
            value={stage}
            onChange={(e) => setStage(e.target.value as Stage)}
          >
            {STAGES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Year groups" hint="Comma separated">
          <input
            className={inputClass}
            value={yearGroups}
            onChange={(e) => setYearGroups(e.target.value)}
            placeholder="Year 5, Year 6"
          />
        </FormField>
      </div>
      <FormField label="Description">
        <textarea
          className={inputClass}
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Overview of what this unit covers"
        />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Duration (lessons)">
          <input
            type="number"
            className={inputClass}
            value={duration}
            onChange={(e) => setDuration(+e.target.value)}
            min={1}
          />
        </FormField>
        <div /> {/* spacer */}
      </div>
      <FormField label="Syllabus outcomes" hint="One per line">
        <textarea
          className={inputClass}
          rows={3}
          value={outcomes}
          onChange={(e) => setOutcomes(e.target.value)}
          placeholder={"ST3-4LW-S\nST3-1WS-S"}
        />
      </FormField>

      {/* Lesson picker */}
      <div>
        <p className="mb-2 text-sm font-semibold text-forest-900">
          Add lessons{" "}
          {selectedLessonIds.size > 0 && (
            <span className="font-normal text-charcoal-soft">
              ({selectedLessonIds.size} selected)
            </span>
          )}
        </p>
        {lessonsLoading ? (
          <div className="flex items-center gap-2 py-3 text-sm text-charcoal-soft">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-forest-600 border-t-transparent" />
            Loading lessons...
          </div>
        ) : allLessons.length === 0 ? (
          <p className="text-sm text-charcoal-soft">
            No lessons yet - create lessons from the Lessons page first.
          </p>
        ) : (
          <div className="max-h-48 space-y-1 overflow-y-auto rounded-2xl border border-sand-dark bg-cream/50 p-2">
            {allLessons.map((lesson) => {
              const selected = selectedLessonIds.has(lesson.id);
              return (
                <button
                  key={lesson.id}
                  type="button"
                  onClick={() => toggleLesson(lesson.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                    selected
                      ? "bg-forest-100 text-forest-900 ring-1 ring-forest-300"
                      : "hover:bg-white text-charcoal"
                  }`}
                >
                  <BookOpen
                    className={`h-4 w-4 shrink-0 ${selected ? "text-forest-600" : "text-charcoal-soft"}`}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {lesson.title}
                  </span>
                  {selected && (
                    <Check className="h-4 w-4 shrink-0 text-forest-600" aria-hidden />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <PublishToggle published={published} setPublished={setPublished} />
      {error && (
        <p className="rounded-2xl bg-clay-400/10 px-4 py-3 text-sm text-clay-600">{error}</p>
      )}
      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? "Creating..." : "Create unit"}
        </Button>
      </div>
    </form>
  );
}

// ---- Lesson form (standalone, no unit required) ----
export function LessonForm({ onSaved }: { onSaved: (lesson: Topic) => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const lesson = await createTopic({ title, description, difficulty: "core" });
      onSaved(lesson);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create lesson");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <FormField label="Lesson title" required>
        <input
          className={inputClass}
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Food Webs and Energy Flow"
        />
      </FormField>
      <FormField label="Description">
        <textarea
          className={inputClass}
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What students will explore in this lesson"
        />
      </FormField>
      {error && (
        <p className="rounded-2xl bg-clay-400/10 px-4 py-3 text-sm text-clay-600">{error}</p>
      )}
      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? "Creating..." : "Create lesson"}
        </Button>
      </div>
    </form>
  );
}

// Keep TopicForm as alias for backwards compat with any remaining usages
export function TopicForm({ onSaved }: { onSaved: () => void }) {
  return <LessonForm onSaved={() => onSaved()} />;
}

// ---- Resource form ----
const RES_TYPES: ResourceType[] = [
  "worksheet",
  "powerpoint",
  "teacherGuide",
  "assessment",
  "activity",
  "extension",
  "support",
];

export function ResourceForm({
  lockedTopicId,
  lockedUnitId,
  lockedTopicTitle,
  onSaved,
}: {
  lockedTopicId?: string;
  lockedUnitId?: string;
  lockedTopicTitle?: string;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ResourceType>("worksheet");
  const [topicId, setTopicId] = useState(lockedTopicId ?? "");
  const [stage, setStage] = useState<Stage>("Stage 3");
  const [difficulty, setDifficulty] = useState<Difficulty>("core");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [published, setPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  // For the dropdown in non-locked context
  const [availableTopics, setAvailableTopics] = useState<Topic[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(!lockedTopicId);

  useEffect(() => {
    if (lockedTopicId) return;
    getTopics().then((t) => { setAvailableTopics(t); setTopicsLoading(false); });
  }, [lockedTopicId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedTopicId = lockedTopicId ?? topicId;
    if (!resolvedTopicId) {
      setError("Please select a topic.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await createResource({
        title,
        type,
        fileUrl: "#",
        topicId: resolvedTopicId,
        unitId: lockedUnitId ?? "",
        stage,
        difficulty,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        teacherNotes: notes || undefined,
        published,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create resource");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <FormField label="Title" required>
        <input
          className={inputClass}
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Resource type">
          <select
            className={inputClass}
            value={type}
            onChange={(e) => setType(e.target.value as ResourceType)}
          >
            {RES_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Difficulty">
          <select
            className={inputClass}
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
          >
            {DIFFICULTIES.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </FormField>
      </div>
      <FormField label="File upload" hint="Placeholder, wires to storage later">
        <div className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-sand-dark bg-cream/50 px-4 py-5 text-sm text-charcoal-soft">
          <UploadCloud className="h-6 w-6" aria-hidden />
          <span>Drag a file here or click to browse (placeholder)</span>
        </div>
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        {lockedTopicId ? (
          <div className="rounded-2xl bg-forest-50 px-4 py-2.5 text-sm text-forest-800">
            <span className="font-semibold">Topic: </span>
            {lockedTopicTitle ?? lockedTopicId}
          </div>
        ) : (
          <FormField label="Topic" required>
            <select
              className={inputClass}
              value={topicId}
              onChange={(e) => setTopicId(e.target.value)}
              disabled={topicsLoading}
            >
              <option value="">{topicsLoading ? "Loading topics…" : "Select a topic…"}</option>
              {availableTopics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </FormField>
        )}
        <FormField label="Stage">
          <select
            className={inputClass}
            value={stage}
            onChange={(e) => setStage(e.target.value as Stage)}
          >
            {STAGES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </FormField>
      </div>
      <FormField label="Tags" hint="Comma separated">
        <input
          className={inputClass}
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
      </FormField>
      <FormField label="Teacher notes">
        <textarea
          className={inputClass}
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </FormField>
      <PublishToggle published={published} setPublished={setPublished} />
      {error && (
        <p className="rounded-2xl bg-clay-400/10 px-4 py-3 text-sm text-clay-600">{error}</p>
      )}
      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save resource"}
        </Button>
      </div>
    </form>
  );
}

// ---- Video form (legacy placeholder - use VideoUploadForm for real Mux uploads) ----
export function VideoForm({ onSaved }: { onSaved: () => void }) {
  return (
    <div className="rounded-2xl bg-forest-50 p-6 text-center text-sm text-charcoal-soft">
      <p className="font-semibold text-forest-900">Use the Videos page to upload reels</p>
      <p className="mt-1">Go to <a href="/admin/videos" className="text-forest-700 underline">Admin - Videos</a> to upload via Mux, or manage topic content directly from the Units page.</p>
      <Button className="mt-4" onClick={onSaved} variant="secondary">Close</Button>
    </div>
  );
}

// ---- Quiz builder ----
const Q_TYPES: QuestionType[] = ["multipleChoice", "trueFalse", "shortResponse"];

export function QuizForm({
  quiz,
  lockedTopicId,
  lockedTopicTitle,
  onSaved,
}: {
  /** Pass an existing quiz to edit it (title + full question set). */
  quiz?: Quiz;
  lockedTopicId?: string;
  lockedTopicTitle?: string;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(quiz?.title ?? "");
  const [questions, setQuestions] = useState<Question[]>(quiz?.questions ?? []);
  const [draft, setDraft] = useState<Question>(blankQuestion());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function blankQuestion(): Question {
    return {
      id: `q-${Date.now()}`,
      questionText: "",
      type: "multipleChoice",
      options: ["", ""],
      correctAnswer: "",
      explanation: "",
      difficulty: "core",
      linkedConcept: "",
    };
  }

  const addQuestion = () => {
    if (!draft.questionText.trim()) return;
    if (editingId) {
      setQuestions((qs) => qs.map((q) => (q.id === editingId ? { ...draft, id: editingId } : q)));
      setEditingId(null);
    } else {
      setQuestions((q) => [...q, { ...draft, id: `q-${Date.now()}` }]);
    }
    setDraft(blankQuestion());
  };

  const startEditQuestion = (q: Question) => {
    setDraft({ ...q });
    setEditingId(q.id);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Auto-commit the in-progress draft if the user filled in a question text
    let finalQuestions = questions;
    if (draft.questionText.trim()) {
      if (editingId) {
        finalQuestions = questions.map((q) => (q.id === editingId ? { ...draft, id: editingId } : q));
      } else {
        finalQuestions = [...questions, { ...draft, id: `q-${Date.now()}` }];
      }
      setQuestions(finalQuestions);
      setDraft(blankQuestion());
      setEditingId(null);
    }
    if (finalQuestions.length === 0) {
      setError("Add at least one question before saving.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      if (quiz) {
        await updateQuiz(quiz.id, { title, questions: finalQuestions });
      } else {
        await createQuiz({ title, topicId: lockedTopicId ?? "", questions: finalQuestions });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save quiz");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <FormField label="Quiz title" required>
        <input
          className={inputClass}
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </FormField>
      {lockedTopicId && (
        <div className="rounded-2xl bg-forest-50 px-4 py-2.5 text-sm text-forest-800">
          <span className="font-semibold">Lesson: </span>
          {lockedTopicTitle ?? lockedTopicId}
        </div>
      )}

      {/* Existing questions */}
      {questions.length > 0 && (
        <div className="space-y-2 rounded-2xl bg-forest-50 p-3">
          {questions.map((q, i) => (
            <div key={q.id} className="flex items-center gap-2 text-sm">
              <Badge tone="forest">{i + 1}</Badge>
              <span className={`flex-1 truncate ${editingId === q.id ? "font-semibold text-forest-700" : "text-charcoal"}`}>
                {q.questionText}
              </span>
              <Badge tone="sand">{q.type}</Badge>
              <button
                type="button"
                onClick={() => startEditQuestion(q)}
                className="text-forest-600 hover:text-forest-800"
                aria-label="Edit question"
              >
                <Pencil className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuestions((qs) => qs.filter((x) => x.id !== q.id));
                  if (editingId === q.id) { setEditingId(null); setDraft(blankQuestion()); }
                }}
                className="text-clay-500 hover:text-clay-600"
                aria-label="Remove question"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Question builder */}
      <div className="space-y-3 rounded-2xl border border-sand-dark bg-white p-4">
        <p className="text-sm font-semibold text-forest-900">
          {editingId ? "Edit question" : "Add a question"}
        </p>
        <FormField label="Question text">
          <input
            className={inputClass}
            value={draft.questionText}
            onChange={(e) => setDraft({ ...draft, questionText: e.target.value })}
          />
        </FormField>
        <FormField label="Type">
          <select
            className={inputClass}
            value={draft.type}
            onChange={(e) => {
              const type = e.target.value as QuestionType;
              setDraft({
                ...draft,
                type,
                options:
                  type === "trueFalse"
                    ? ["True", "False"]
                    : type === "shortResponse"
                    ? []
                    : ["", ""],
              });
            }}
          >
            {Q_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </FormField>
        {draft.type === "multipleChoice" && (
          <FormField label="Options" hint="Add answer choices">
            <div className="space-y-2">
              {draft.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    className={inputClass}
                    value={opt}
                    placeholder={`Option ${i + 1}`}
                    onChange={(e) => {
                      const options = [...draft.options];
                      options[i] = e.target.value;
                      setDraft({ ...draft, options });
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setDraft({ ...draft, correctAnswer: opt })}
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                      draft.correctAnswer === opt && opt
                        ? "bg-forest-700 text-cream"
                        : "bg-forest-50 text-forest-700"
                    }`}
                  >
                    <Check className="h-3 w-3" aria-hidden /> correct
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setDraft({ ...draft, options: [...draft.options, ""] })}
                className="text-xs font-semibold text-forest-700"
              >
                + add option
              </button>
            </div>
          </FormField>
        )}
        {draft.type === "trueFalse" && (
          <FormField label="Correct answer">
            <select
              className={inputClass}
              value={draft.correctAnswer}
              onChange={(e) => setDraft({ ...draft, correctAnswer: e.target.value })}
            >
              <option value="">Select…</option>
              <option>True</option>
              <option>False</option>
            </select>
          </FormField>
        )}
        {draft.type === "shortResponse" && (
          <FormField label="Model answer">
            <input
              className={inputClass}
              value={draft.correctAnswer}
              onChange={(e) => setDraft({ ...draft, correctAnswer: e.target.value })}
            />
          </FormField>
        )}
        <FormField label="Explanation">
          <input
            className={inputClass}
            value={draft.explanation}
            onChange={(e) => setDraft({ ...draft, explanation: e.target.value })}
          />
        </FormField>
        <FormField label="Linked concept">
          <input
            className={inputClass}
            value={draft.linkedConcept}
            onChange={(e) => setDraft({ ...draft, linkedConcept: e.target.value })}
          />
        </FormField>
        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={addQuestion}>
            {editingId
              ? <><Check className="h-4 w-4" aria-hidden /> Update question</>
              : <><Plus className="h-4 w-4" aria-hidden /> Add question</>}
          </Button>
          {editingId && (
            <button
              type="button"
              onClick={() => { setEditingId(null); setDraft(blankQuestion()); }}
              className="text-xs font-semibold text-charcoal-soft hover:underline"
            >
              Cancel edit
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="rounded-2xl bg-clay-400/10 px-4 py-3 text-sm text-clay-600">{error}</p>
      )}
      <div className="flex items-center justify-between gap-3">
        {questions.length === 0 && !draft.questionText.trim() && (
          <p className="text-xs text-charcoal-soft">Add at least one question above first.</p>
        )}
        <div className="ml-auto">
          <Button type="submit" disabled={saving}>
            {saving
              ? "Saving..."
              : quiz
              ? `Save changes${questions.length > 0 ? ` (${questions.length})` : ""}`
              : questions.length > 0
              ? `Save quiz (${questions.length})`
              : "Save quiz"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function PublishToggle({
  published,
  setPublished,
}: {
  published: boolean;
  setPublished: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-2xl bg-forest-50 px-4 py-3">
      <button
        type="button"
        onClick={() => setPublished(!published)}
        className={`relative h-6 w-11 rounded-full transition-colors ${
          published ? "bg-forest-600" : "bg-charcoal/20"
        }`}
        aria-pressed={published}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            published ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
      <span className="text-sm font-semibold text-forest-900">
        {published ? "Published, visible to teachers" : "Draft, hidden until published"}
      </span>
    </label>
  );
}

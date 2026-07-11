"use client";
/*
 * Admin content-authoring forms. All forms write to Supabase.
 * Forms accept optional locked* props so they can be used in topic-context
 * (where topic/unit are already known) without showing the dropdowns.
 */
import { useState } from "react";
import { UploadCloud, X, Check, Plus } from "lucide-react";
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
  getTopics,
} from "@/lib/supabaseService";
import type {
  Stage,
  ResourceType,
  Difficulty,
  QuestionType,
  Question,
  Topic,
} from "@/types";

const STAGES: Stage[] = ["Stage 3", "Stage 4", "Stage 5"];
const DIFFICULTIES: Difficulty[] = ["foundation", "core", "advanced"];

// Synchronous topic select — populated by caller via prop to avoid async in older pages.
function TopicSelect({
  value,
  onChange,
  topics,
}: {
  value: string;
  onChange: (v: string) => void;
  topics: Topic[];
}) {
  return (
    <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Select a topic…</option>
      {topics.map((t) => (
        <option key={t.id} value={t.id}>
          {t.title}
        </option>
      ))}
    </select>
  );
}

// ---- Unit form ----
export function UnitForm({ onSaved }: { onSaved: () => void }) {
  const [title, setTitle] = useState("");
  const [stage, setStage] = useState<Stage>("Stage 3");
  const [yearGroups, setYearGroups] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(10);
  const [outcomes, setOutcomes] = useState("");
  const [published, setPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await createUnit({
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
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create unit");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <FormField label="Unit title" required>
        <input
          className={inputClass}
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </FormField>
      <div className="grid grid-cols-3 gap-3">
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
        <FormField label="Year groups" hint="Comma sep">
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
        />
      </FormField>
      <FormField label="Duration (lessons)">
        <input
          type="number"
          className={inputClass}
          value={duration}
          onChange={(e) => setDuration(+e.target.value)}
        />
      </FormField>
      <FormField label="Syllabus outcomes" hint="One per line">
        <textarea
          className={inputClass}
          rows={2}
          value={outcomes}
          onChange={(e) => setOutcomes(e.target.value)}
        />
      </FormField>
      <PublishToggle published={published} setPublished={setPublished} />
      {error && (
        <p className="rounded-2xl bg-clay-400/10 px-4 py-3 text-sm text-clay-600">{error}</p>
      )}
      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save unit"}
        </Button>
      </div>
    </form>
  );
}

// ---- Topic form ----
export function TopicForm({
  unitId,
  onSaved,
}: {
  unitId: string;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("core");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await createTopic({ unitId, title, description, difficulty });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create topic");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <FormField label="Topic title" required>
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
          placeholder="What students will explore in this topic"
        />
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
      {error && (
        <p className="rounded-2xl bg-clay-400/10 px-4 py-3 text-sm text-clay-600">{error}</p>
      )}
      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? "Creating..." : "Create topic"}
        </Button>
      </div>
    </form>
  );
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
  const [topicsLoaded, setTopicsLoaded] = useState(!!lockedTopicId);

  // Load topics lazily if no locked topic
  const onFocusTopicSelect = async () => {
    if (topicsLoaded || lockedTopicId) return;
    const topics = await getTopics();
    setAvailableTopics(topics);
    setTopicsLoaded(true);
  };

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
              onFocus={onFocusTopicSelect}
            >
              <option value="">Select a topic…</option>
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
  lockedTopicId,
  lockedTopicTitle,
  onSaved,
}: {
  lockedTopicId?: string;
  lockedTopicTitle?: string;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [topicId, setTopicId] = useState(lockedTopicId ?? "");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [draft, setDraft] = useState<Question>(blankQuestion());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [availableTopics, setAvailableTopics] = useState<Topic[]>([]);
  const [topicsLoaded, setTopicsLoaded] = useState(!!lockedTopicId);

  const onFocusTopicSelect = async () => {
    if (topicsLoaded || lockedTopicId) return;
    const topics = await getTopics();
    setAvailableTopics(topics);
    setTopicsLoaded(true);
  };

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
    if (!draft.questionText) return;
    setQuestions((q) => [...q, { ...draft, id: `q-${Date.now()}` }]);
    setDraft(blankQuestion());
  };

  const resolvedTopicId = lockedTopicId ?? topicId;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvedTopicId) {
      setError("Please select a topic.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await createQuiz({ title, topicId: resolvedTopicId, questions });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save quiz");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Quiz title" required>
          <input
            className={inputClass}
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </FormField>
        {lockedTopicId ? (
          <div className="flex items-end pb-0.5">
            <div className="w-full rounded-2xl bg-forest-50 px-4 py-2.5 text-sm text-forest-800">
              <span className="font-semibold">Topic: </span>
              {lockedTopicTitle ?? lockedTopicId}
            </div>
          </div>
        ) : (
          <FormField label="Topic" required>
            <select
              className={inputClass}
              value={topicId}
              onChange={(e) => setTopicId(e.target.value)}
              onFocus={onFocusTopicSelect}
            >
              <option value="">Select a topic…</option>
              {availableTopics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </FormField>
        )}
      </div>

      {/* Existing questions */}
      {questions.length > 0 && (
        <div className="space-y-2 rounded-2xl bg-forest-50 p-3">
          {questions.map((q, i) => (
            <div key={q.id} className="flex items-center gap-2 text-sm">
              <Badge tone="forest">{i + 1}</Badge>
              <span className="flex-1 truncate text-charcoal">{q.questionText}</span>
              <Badge tone="sand">{q.type}</Badge>
              <button
                type="button"
                onClick={() => setQuestions((qs) => qs.filter((x) => x.id !== q.id))}
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
        <p className="text-sm font-semibold text-forest-900">Add a question</p>
        <FormField label="Question text">
          <input
            className={inputClass}
            value={draft.questionText}
            onChange={(e) => setDraft({ ...draft, questionText: e.target.value })}
          />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
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
          <FormField label="Difficulty">
            <select
              className={inputClass}
              value={draft.difficulty}
              onChange={(e) => setDraft({ ...draft, difficulty: e.target.value as Difficulty })}
            >
              {DIFFICULTIES.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </FormField>
        </div>
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
        <Button type="button" variant="secondary" size="sm" onClick={addQuestion}>
          <Plus className="h-4 w-4" aria-hidden /> Add question
        </Button>
      </div>

      {error && (
        <p className="rounded-2xl bg-clay-400/10 px-4 py-3 text-sm text-clay-600">{error}</p>
      )}
      <div className="flex justify-end">
        <Button type="submit" disabled={questions.length === 0 || saving}>
          {saving ? "Saving..." : `Save quiz (${questions.length})`}
        </Button>
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

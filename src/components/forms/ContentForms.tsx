"use client";
/*
 * Admin content-authoring forms. Each is a controlled form that writes through
 * the dataService (createVideo/createResource/createUnit/createQuiz) and calls
 * onSaved so the parent list refreshes. Kept as pure forms so they can be
 * dropped into a Modal or a full page.
 */
import { useState } from "react";
import {
  FormField,
  inputClass,
  Button,
  Badge,
} from "@/components/ui/primitives";
import {
  createVideo,
  createResource,
  createUnit,
  createQuiz,
  getTopics,
  getUnits,
} from "@/lib/dataService";
import type {
  Stage,
  ResourceType,
  Difficulty,
  QuestionType,
  Question,
} from "@/types";

const STAGES: Stage[] = ["Stage 3", "Stage 4", "Stage 5"];
const DIFFICULTIES: Difficulty[] = ["foundation", "core", "advanced"];

function TopicSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const topics = getTopics();
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

// ---- Video form ----
export function VideoForm({ onSaved }: { onSaved: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [topicId, setTopicId] = useState("");
  const [stage, setStage] = useState<Stage>("Stage 3");
  const [duration, setDuration] = useState(90);
  const [tags, setTags] = useState("");
  const [emoji, setEmoji] = useState("🎬");
  const [transcript, setTranscript] = useState("");
  const [intent, setIntent] = useState("");
  const [criteria, setCriteria] = useState("");
  const [published, setPublished] = useState(true);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const topic = getTopics().find((t) => t.id === topicId);
    createVideo({
      title,
      description,
      topicId,
      unitId: topic?.unitId ?? "",
      videoUrl,
      thumbnailUrl: "",
      thumbEmoji: emoji,
      durationSeconds: duration,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      stage,
      yearGroups: [],
      transcript,
      learningIntent: intent,
      successCriteria: criteria.split("\n").map((s) => s.trim()).filter(Boolean),
      published,
    });
    onSaved();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <FormField label="Title" required>
        <input className={inputClass} required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Why Koalas Sleep So Much" />
      </FormField>
      <FormField label="Description">
        <textarea className={inputClass} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Video URL" hint="YouTube / storage URL">
          <input className={inputClass} value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://…" />
        </FormField>
        <FormField label="Thumbnail emoji" hint="Placeholder until real media">
          <input className={inputClass} value={emoji} onChange={(e) => setEmoji(e.target.value)} />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Topic" required>
          <TopicSelect value={topicId} onChange={setTopicId} />
        </FormField>
        <FormField label="Stage">
          <select className={inputClass} value={stage} onChange={(e) => setStage(e.target.value as Stage)}>
            {STAGES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Duration (seconds)">
          <input type="number" className={inputClass} value={duration} onChange={(e) => setDuration(+e.target.value)} />
        </FormField>
        <FormField label="Tags" hint="Comma separated">
          <input className={inputClass} value={tags} onChange={(e) => setTags(e.target.value)} placeholder="adaptation, koala" />
        </FormField>
      </div>
      <FormField label="Learning intention">
        <input className={inputClass} value={intent} onChange={(e) => setIntent(e.target.value)} />
      </FormField>
      <FormField label="Success criteria" hint="One per line">
        <textarea className={inputClass} rows={2} value={criteria} onChange={(e) => setCriteria(e.target.value)} />
      </FormField>
      <FormField label="Transcript">
        <textarea className={inputClass} rows={2} value={transcript} onChange={(e) => setTranscript(e.target.value)} />
      </FormField>
      <PublishToggle published={published} setPublished={setPublished} />
      <div className="flex justify-end gap-2">
        <Button type="submit">Save video</Button>
      </div>
    </form>
  );
}

// ---- Resource form ----
const RES_TYPES: ResourceType[] = ["worksheet", "powerpoint", "teacherGuide", "assessment", "activity", "extension", "support"];

export function ResourceForm({ onSaved }: { onSaved: () => void }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ResourceType>("worksheet");
  const [topicId, setTopicId] = useState("");
  const [stage, setStage] = useState<Stage>("Stage 3");
  const [difficulty, setDifficulty] = useState<Difficulty>("core");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [published, setPublished] = useState(true);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const topic = getTopics().find((t) => t.id === topicId);
    createResource({
      title,
      type,
      fileUrl: "#",
      topicId,
      unitId: topic?.unitId ?? "",
      stage,
      difficulty,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      teacherNotes: notes,
      published,
    });
    onSaved();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <FormField label="Title" required>
        <input className={inputClass} required value={title} onChange={(e) => setTitle(e.target.value)} />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Resource type">
          <select className={inputClass} value={type} onChange={(e) => setType(e.target.value as ResourceType)}>
            {RES_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </FormField>
        <FormField label="Difficulty">
          <select className={inputClass} value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
            {DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}
          </select>
        </FormField>
      </div>
      <FormField label="File upload" hint="Placeholder — wires to Firebase Storage later">
        <div className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-sand-dark bg-cream/50 px-4 py-5 text-sm text-charcoal-soft">
          <span className="text-2xl">☁️</span>
          <span>Drag a file here or click to browse (mock)</span>
        </div>
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Topic" required>
          <TopicSelect value={topicId} onChange={setTopicId} />
        </FormField>
        <FormField label="Stage">
          <select className={inputClass} value={stage} onChange={(e) => setStage(e.target.value as Stage)}>
            {STAGES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </FormField>
      </div>
      <FormField label="Tags" hint="Comma separated">
        <input className={inputClass} value={tags} onChange={(e) => setTags(e.target.value)} />
      </FormField>
      <FormField label="Teacher notes">
        <textarea className={inputClass} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </FormField>
      <PublishToggle published={published} setPublished={setPublished} />
      <div className="flex justify-end">
        <Button type="submit">Save resource</Button>
      </div>
    </form>
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
  const [emoji, setEmoji] = useState("🌏");
  const [published, setPublished] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    createUnit({
      title,
      stage,
      yearGroups: yearGroups.split(",").map((y) => y.trim()).filter(Boolean),
      description,
      durationLessons: duration,
      outcomes: outcomes.split("\n").map((o) => o.trim()).filter(Boolean),
      topicIds: [],
      coverImage: "/trees.png",
      coverEmoji: emoji,
      published,
    });
    onSaved();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <FormField label="Unit title" required>
        <input className={inputClass} required value={title} onChange={(e) => setTitle(e.target.value)} />
      </FormField>
      <div className="grid grid-cols-3 gap-3">
        <FormField label="Stage">
          <select className={inputClass} value={stage} onChange={(e) => setStage(e.target.value as Stage)}>
            {STAGES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </FormField>
        <FormField label="Year groups" hint="Comma sep">
          <input className={inputClass} value={yearGroups} onChange={(e) => setYearGroups(e.target.value)} placeholder="Year 5, Year 6" />
        </FormField>
        <FormField label="Cover emoji">
          <input className={inputClass} value={emoji} onChange={(e) => setEmoji(e.target.value)} />
        </FormField>
      </div>
      <FormField label="Description">
        <textarea className={inputClass} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      </FormField>
      <FormField label="Duration (lessons)">
        <input type="number" className={inputClass} value={duration} onChange={(e) => setDuration(+e.target.value)} />
      </FormField>
      <FormField label="Syllabus outcomes" hint="One per line">
        <textarea className={inputClass} rows={2} value={outcomes} onChange={(e) => setOutcomes(e.target.value)} />
      </FormField>
      <PublishToggle published={published} setPublished={setPublished} />
      <div className="flex justify-end">
        <Button type="submit">Save unit</Button>
      </div>
    </form>
  );
}

// ---- Quiz builder ----
const Q_TYPES: QuestionType[] = ["multipleChoice", "trueFalse", "shortResponse"];

export function QuizForm({ onSaved }: { onSaved: () => void }) {
  const [title, setTitle] = useState("");
  const [topicId, setTopicId] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [draft, setDraft] = useState<Question>(blankQuestion());

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

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    createQuiz({ title, topicId, questions });
    onSaved();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Quiz title" required>
          <input className={inputClass} required value={title} onChange={(e) => setTitle(e.target.value)} />
        </FormField>
        <FormField label="Topic" required>
          <TopicSelect value={topicId} onChange={setTopicId} />
        </FormField>
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
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Question builder */}
      <div className="space-y-3 rounded-2xl border border-sand-dark bg-white p-4">
        <p className="text-sm font-semibold text-forest-900">Add a question</p>
        <FormField label="Question text">
          <input className={inputClass} value={draft.questionText} onChange={(e) => setDraft({ ...draft, questionText: e.target.value })} />
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
                  options: type === "trueFalse" ? ["True", "False"] : type === "shortResponse" ? [] : ["", ""],
                });
              }}
            >
              {Q_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </FormField>
          <FormField label="Difficulty">
            <select className={inputClass} value={draft.difficulty} onChange={(e) => setDraft({ ...draft, difficulty: e.target.value as Difficulty })}>
              {DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}
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
                  <button type="button" onClick={() => setDraft({ ...draft, correctAnswer: opt })}
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${draft.correctAnswer === opt && opt ? "bg-forest-700 text-cream" : "bg-forest-50 text-forest-700"}`}>
                    ✓ correct
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => setDraft({ ...draft, options: [...draft.options, ""] })}
                className="text-xs font-semibold text-forest-700">+ add option</button>
            </div>
          </FormField>
        )}
        {draft.type === "trueFalse" && (
          <FormField label="Correct answer">
            <select className={inputClass} value={draft.correctAnswer} onChange={(e) => setDraft({ ...draft, correctAnswer: e.target.value })}>
              <option value="">Select…</option>
              <option>True</option>
              <option>False</option>
            </select>
          </FormField>
        )}
        {draft.type === "shortResponse" && (
          <FormField label="Model answer">
            <input className={inputClass} value={draft.correctAnswer} onChange={(e) => setDraft({ ...draft, correctAnswer: e.target.value })} />
          </FormField>
        )}
        <FormField label="Explanation">
          <input className={inputClass} value={draft.explanation} onChange={(e) => setDraft({ ...draft, explanation: e.target.value })} />
        </FormField>
        <FormField label="Linked concept">
          <input className={inputClass} value={draft.linkedConcept} onChange={(e) => setDraft({ ...draft, linkedConcept: e.target.value })} />
        </FormField>
        <Button type="button" variant="secondary" size="sm" onClick={addQuestion}>➕ Add question</Button>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={questions.length === 0}>Save quiz ({questions.length})</Button>
      </div>
    </form>
  );
}

function PublishToggle({ published, setPublished }: { published: boolean; setPublished: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 rounded-2xl bg-forest-50 px-4 py-3">
      <button
        type="button"
        onClick={() => setPublished(!published)}
        className={`relative h-6 w-11 rounded-full transition-colors ${published ? "bg-forest-600" : "bg-charcoal/20"}`}
        aria-pressed={published}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${published ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
      <span className="text-sm font-semibold text-forest-900">
        {published ? "Published — visible to teachers" : "Draft — hidden until published"}
      </span>
    </label>
  );
}

export { getUnits };

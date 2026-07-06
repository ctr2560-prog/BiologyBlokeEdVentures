"use client";
import { useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import {
  SectionHeader,
  Button,
  Badge,
  Modal,
  EmptyState,
  inputClass,
} from "@/components/ui/primitives";
import { VideoCard, ResourceCard, UnitCard, TopicCard } from "@/components/cards/ContentCards";
import {
  VideoForm,
  ResourceForm,
  UnitForm,
  QuizForm,
} from "@/components/forms/ContentForms";
import {
  getVideos,
  getResources,
  getUnits,
  getTopics,
  getQuizzes,
} from "@/lib/dataService";
import type { Stage } from "@/types";

type Tab = "videos" | "resources" | "units" | "topics" | "quizzes";
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "videos", label: "Videos", icon: "" },
  { id: "resources", label: "Resources", icon: "" },
  { id: "units", label: "Units", icon: "" },
  { id: "topics", label: "Topics", icon: "" },
  { id: "quizzes", label: "Quizzes", icon: "" },
];

export default function ContentLibrary() {
  const { version, bump } = useApp();
  const [tab, setTab] = useState<Tab>("videos");
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState<Stage | "all">("all");
  const [publishedOnly, setPublishedOnly] = useState(false);
  const [modal, setModal] = useState<null | Tab>(null);

  // version dependency forces recompute after a create.
  const data = useMemo(() => {
    void version;
    const q = query.toLowerCase();
    const stageMatch = (s: Stage) => stage === "all" || s === stage;
    return {
      videos: getVideos().filter(
        (v) =>
          (v.title.toLowerCase().includes(q) || v.tags.join(" ").includes(q)) &&
          stageMatch(v.stage) &&
          (!publishedOnly || v.published)
      ),
      resources: getResources().filter(
        (r) => r.title.toLowerCase().includes(q) && stageMatch(r.stage) && (!publishedOnly || r.published)
      ),
      units: getUnits().filter(
        (u) => u.title.toLowerCase().includes(q) && stageMatch(u.stage) && (!publishedOnly || u.published)
      ),
      topics: getTopics().filter((t) => t.title.toLowerCase().includes(q)),
      quizzes: getQuizzes().filter((z) => z.title.toLowerCase().includes(q)),
    };
  }, [version, query, stage, publishedOnly]);

  const onSaved = () => {
    bump();
    setModal(null);
  };

  const addLabel: Record<Tab, string> = {
    videos: "Add video",
    resources: "Add resource",
    units: "Add unit",
    topics: "Add topic",
    quizzes: "Build quiz",
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Content Library"
        subtitle="Every video, resource, unit and quiz, searchable and filterable"
        action={
          tab !== "topics" ? (
            <Button onClick={() => setModal(tab)}> {addLabel[tab]}</Button>
          ) : undefined
        }
      />

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              tab === t.id ? "bg-forest-700 text-cream" : "bg-white text-charcoal-soft ring-1 ring-sand hover:bg-forest-50"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-3xl bg-white p-3 shadow-soft ring-1 ring-black/5">
        <input
          className={`${inputClass} flex-1 min-w-48`}
          placeholder=" Search content…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select className={`${inputClass} w-auto`} value={stage} onChange={(e) => setStage(e.target.value as Stage | "all")}>
          <option value="all">All stages</option>
          <option>Stage 3</option>
          <option>Stage 4</option>
          <option>Stage 5</option>
        </select>
        <label className="flex items-center gap-2 whitespace-nowrap rounded-2xl bg-forest-50 px-3 py-2 text-sm font-medium text-forest-800">
          <input type="checkbox" checked={publishedOnly} onChange={(e) => setPublishedOnly(e.target.checked)} />
          Published only
        </label>
      </div>

      {/* Content grids */}
      {tab === "videos" &&
        (data.videos.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.videos.map((v) => (
              <VideoCard key={v.id} video={v} />
            ))}
          </div>
        ) : (
          <EmptyState title="No videos found" message="Try a different search, or add a new reel." action={<Button onClick={() => setModal("videos")}>Add video</Button>} />
        ))}

      {tab === "resources" &&
        (data.resources.length ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {data.resources.map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
        ) : (
          <EmptyState title="No resources found" message="Upload worksheets, guides and activities here." action={<Button onClick={() => setModal("resources")}>Add resource</Button>} />
        ))}

      {tab === "units" &&
        (data.units.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.units.map((u) => (
              <UnitCard key={u.id} unit={u} href={`/admin/units`} />
            ))}
          </div>
        ) : (
          <EmptyState title="No units yet" message="Create your first unit of work." action={<Button onClick={() => setModal("units")}>Add unit</Button>} />
        ))}

      {tab === "topics" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.topics.map((t) => (
            <TopicCard key={t.id} topic={t} />
          ))}
        </div>
      )}

      {tab === "quizzes" &&
        (data.quizzes.length ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {data.quizzes.map((z) => (
              <div key={z.id} className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-black/5">
                <div className="flex items-center justify-between">
                  <h3 className="display font-bold text-forest-900">{z.title}</h3>
                  <Badge tone="forest">{z.questions.length} Q</Badge>
                </div>
                <ul className="mt-3 space-y-1.5 text-sm text-charcoal-soft">
                  {z.questions.slice(0, 3).map((q) => (
                    <li key={q.id} className="truncate">• {q.questionText}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No quizzes yet" message="Build a quick check for a topic." action={<Button onClick={() => setModal("quizzes")}>Build quiz</Button>} />
        ))}

      {/* Create modals */}
      <Modal open={modal === "videos"} onClose={() => setModal(null)} title="Add video" maxWidth="max-w-2xl">
        <VideoForm onSaved={onSaved} />
      </Modal>
      <Modal open={modal === "resources"} onClose={() => setModal(null)} title="Add resource" maxWidth="max-w-2xl">
        <ResourceForm onSaved={onSaved} />
      </Modal>
      <Modal open={modal === "units"} onClose={() => setModal(null)} title="Add unit" maxWidth="max-w-2xl">
        <UnitForm onSaved={onSaved} />
      </Modal>
      <Modal open={modal === "quizzes"} onClose={() => setModal(null)} title="Quiz builder" maxWidth="max-w-2xl">
        <QuizForm onSaved={onSaved} />
      </Modal>
    </div>
  );
}

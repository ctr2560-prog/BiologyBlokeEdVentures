"use client";
import { useCallback, useEffect, useState } from "react";
import { SectionHeader, Button, Modal, Badge, EmptyState } from "@/components/ui/primitives";
import { UnitForm, TopicForm } from "@/components/forms/ContentForms";
import { TopicContentModal } from "./TopicContentModal";
import { getUnits, getTopicsByUnit } from "@/lib/supabaseService";
import {
  Leaf,
  ChevronUp,
  ChevronDown,
  Plus,
  Film,
  FileText,
  CircleHelp,
  Loader,
  BookOpen,
} from "lucide-react";
import type { Unit, Topic } from "@/types";

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);
  const [unitTopics, setUnitTopics] = useState<Record<string, Topic[]>>({});
  const [topicsLoading, setTopicsLoading] = useState<Record<string, boolean>>({});

  // Modal states
  const [createUnitOpen, setCreateUnitOpen] = useState(false);
  const [createTopicFor, setCreateTopicFor] = useState<Unit | null>(null);
  const [managingTopic, setManagingTopic] = useState<Topic | null>(null);

  const loadUnits = useCallback(async () => {
    const data = await getUnits();
    setUnits(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUnits();
  }, [loadUnits]);

  const toggleUnit = async (unit: Unit) => {
    const isOpen = expandedUnit === unit.id;
    setExpandedUnit(isOpen ? null : unit.id);

    if (!isOpen && !unitTopics[unit.id]) {
      setTopicsLoading((p) => ({ ...p, [unit.id]: true }));
      const topics = await getTopicsByUnit(unit.id);
      setUnitTopics((p) => ({ ...p, [unit.id]: topics }));
      setTopicsLoading((p) => ({ ...p, [unit.id]: false }));
    }
  };

  const refreshTopics = async (unitId: string) => {
    const topics = await getTopicsByUnit(unitId);
    setUnitTopics((p) => ({ ...p, [unitId]: topics }));
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
        title="Units and Topics"
        subtitle="Structure your curriculum, units contain topics which hold videos, resources and quizzes"
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
          message="Create your first unit to start building your curriculum."
          action={
            <Button onClick={() => setCreateUnitOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden /> Create unit
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {units.map((unit) => {
            const open = expandedUnit === unit.id;
            const topics = unitTopics[unit.id] ?? [];
            const isLoadingTopics = topicsLoading[unit.id];

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
                    <p className="mt-0.5 line-clamp-1 text-sm text-charcoal-soft">
                      {unit.description}
                    </p>
                  </div>
                  <div className="hidden shrink-0 items-center gap-3 text-sm text-charcoal-soft sm:flex">
                    <span>{unit.topicIds.length} topics</span>
                    <span>{unit.durationLessons} lessons</span>
                    {open ? (
                      <ChevronUp className="h-5 w-5" aria-hidden />
                    ) : (
                      <ChevronDown className="h-5 w-5" aria-hidden />
                    )}
                  </div>
                </button>

                {/* Unit detail panel */}
                {open && (
                  <div className="border-t border-sand bg-cream/40 p-5 space-y-5">
                    {/* Unit meta */}
                    <div className="grid gap-3 md:grid-cols-2">
                      {unit.yearGroups.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-charcoal-soft">
                            Year groups
                          </p>
                          <p className="text-sm text-charcoal">{unit.yearGroups.join(", ")}</p>
                        </div>
                      )}
                      {unit.outcomes.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-charcoal-soft">
                            Syllabus outcomes
                          </p>
                          <ul className="text-sm text-charcoal">
                            {unit.outcomes.map((o) => (
                              <li key={o}>- {o}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Topics section */}
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-semibold text-forest-900">Topics</p>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setCreateTopicFor(unit)}
                        >
                          <Plus className="h-3.5 w-3.5" aria-hidden /> Add topic
                        </Button>
                      </div>

                      {isLoadingTopics ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader className="h-6 w-6 animate-spin text-forest-600" aria-hidden />
                        </div>
                      ) : topics.length === 0 ? (
                        <div className="rounded-2xl border-2 border-dashed border-sand-dark bg-cream/50 px-4 py-6 text-center text-sm text-charcoal-soft">
                          No topics yet. Add the first topic to this unit.
                        </div>
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {topics.map((topic) => (
                            <div
                              key={topic.id}
                              className="flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-sand"
                            >
                              <div>
                                <p className="font-semibold text-forest-900">{topic.title}</p>
                                {topic.description && (
                                  <p className="mt-0.5 line-clamp-2 text-xs text-charcoal-soft">
                                    {topic.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-charcoal-soft">
                                <span className="flex items-center gap-1">
                                  <Film className="h-3.5 w-3.5" aria-hidden />
                                  {topic.videoIds.length}
                                </span>
                                <span className="flex items-center gap-1">
                                  <FileText className="h-3.5 w-3.5" aria-hidden />
                                  {topic.resourceIds.length}
                                </span>
                                <span className="flex items-center gap-1">
                                  <CircleHelp className="h-3.5 w-3.5" aria-hidden />
                                  {topic.quizIds.length}
                                </span>
                                <Badge
                                  tone={
                                    topic.difficulty === "foundation"
                                      ? "clay"
                                      : topic.difficulty === "advanced"
                                      ? "mist"
                                      : "forest"
                                  }
                                  className="ml-auto"
                                >
                                  {topic.difficulty}
                                </Badge>
                              </div>
                              <Button
                                size="sm"
                                variant="secondary"
                                className="w-full"
                                onClick={() => setManagingTopic(topic)}
                              >
                                Manage content
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create unit modal */}
      <Modal
        open={createUnitOpen}
        onClose={() => setCreateUnitOpen(false)}
        title="Create unit"
        maxWidth="max-w-2xl"
      >
        <UnitForm
          onSaved={async () => {
            await loadUnits();
            setCreateUnitOpen(false);
          }}
        />
      </Modal>

      {/* Create topic modal */}
      <Modal
        open={!!createTopicFor}
        onClose={() => setCreateTopicFor(null)}
        title={createTopicFor ? `Add topic to "${createTopicFor.title}"` : "Add topic"}
        maxWidth="max-w-lg"
      >
        {createTopicFor && (
          <TopicForm
            unitId={createTopicFor.id}
            onSaved={async () => {
              await refreshTopics(createTopicFor.id);
              await loadUnits();
              setCreateTopicFor(null);
            }}
          />
        )}
      </Modal>

      {/* Topic content management modal */}
      {managingTopic && (
        <TopicContentModal
          topic={managingTopic}
          open={!!managingTopic}
          onClose={() => setManagingTopic(null)}
        />
      )}
    </div>
  );
}

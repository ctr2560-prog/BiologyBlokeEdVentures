"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SectionHeader, Badge, EmptyState, Button } from "@/components/ui/primitives";
import { getActivities, deleteActivity } from "@/lib/supabaseService";
import {
  BarChart2,
  BookOpen,
  Loader,
  PenLine,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import type { Activity, ActivityBlock } from "@/types";

const DIFF_TONE = {
  foundation: "clay",
  core: "forest",
  advanced: "mist",
} as const;

const BLOCK_ICON: Record<ActivityBlock["type"], React.ReactNode> = {
  q_and_a: <PenLine className="h-3.5 w-3.5" />,
  writing: <BookOpen className="h-3.5 w-3.5" />,
  research: <Search className="h-3.5 w-3.5" />,
  drawing_canvas: <Pencil className="h-3.5 w-3.5" />,
  graph: <BarChart2 className="h-3.5 w-3.5" />,
};

const BLOCK_LABEL: Record<ActivityBlock["type"], string> = {
  q_and_a: "Q&A",
  writing: "Writing",
  research: "Research",
  drawing_canvas: "Drawing",
  graph: "Graph",
};

function ActivityCard({
  activity,
  onEdit,
  onDelete,
}: {
  activity: Activity;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const blockTypeCounts = activity.blocks.reduce<Record<string, number>>((acc, b) => {
    acc[b.type] = (acc[b.type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-soft ring-1 ring-black/5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-forest-900">{activity.title}</p>
          <p className="mt-0.5 text-xs text-charcoal-soft">
            {activity.blocks.length} block{activity.blocks.length !== 1 ? "s" : ""}
            {activity.lessonId ? " · linked to lesson" : ""}
          </p>
        </div>
        <Badge tone={DIFF_TONE[activity.difficulty]}>
          {activity.difficulty.charAt(0).toUpperCase() + activity.difficulty.slice(1)}
        </Badge>
      </div>

      {/* Block type chips */}
      {activity.blocks.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(blockTypeCounts).map(([type, count]) => (
            <span
              key={type}
              className="inline-flex items-center gap-1 rounded-full bg-cream px-2.5 py-1 text-[0.65rem] font-medium text-charcoal-soft ring-1 ring-black/8"
            >
              {BLOCK_ICON[type as ActivityBlock["type"]]}
              {count > 1 ? `${count}× ` : ""}{BLOCK_LABEL[type as ActivityBlock["type"]]}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 border-t border-sand pt-3">
        <Button size="sm" onClick={onEdit} className="flex-1">
          <Pencil className="h-3.5 w-3.5" /> Edit
        </Button>
        <button
          onClick={onDelete}
          className="rounded-xl p-2 text-charcoal-soft transition hover:bg-clay-50 hover:text-clay-600"
          aria-label="Delete activity"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function ResourcesPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = () => getActivities().then((a) => { setActivities(a); setLoading(false); });
  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this activity? This can't be undone.")) return;
    setDeleting(id);
    await deleteActivity(id);
    setActivities((prev) => prev.filter((a) => a.id !== id));
    setDeleting(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader className="h-8 w-8 animate-spin text-forest-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Activity Library"
        subtitle="Build in-app activities — writing, drawing, research, graphs — served adaptively to students"
        action={
          <Button onClick={() => router.push("/admin/resources/new")}>
            <Plus className="h-4 w-4" /> New activity
          </Button>
        }
      />

      {activities.length === 0 ? (
        <EmptyState
          Icon={PenLine}
          title="No activities yet"
          message="Create your first in-app activity. Students complete these after watching their lesson video."
          action={
            <Button onClick={() => router.push("/admin/resources/new")}>
              <Plus className="h-4 w-4" /> New activity
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {activities.map((a) => (
            <div key={a.id} className={deleting === a.id ? "opacity-50 pointer-events-none" : ""}>
              <ActivityCard
                activity={a}
                onEdit={() => router.push(`/admin/resources/${a.id}`)}
                onDelete={() => handleDelete(a.id)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

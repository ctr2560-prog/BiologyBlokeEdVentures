"use client";
import { FullPageLoader } from "@/components/ui/BrandLoader";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SectionHeader, EmptyState, Button } from "@/components/ui/primitives";
import { getActivities, deleteActivity } from "@/lib/supabaseService";
import { PenLine, Pencil, Plus, Printer, Trash2 } from "lucide-react";
import type { Activity } from "@/types";
import { BLOCK_CATALOGUE } from "./[activityId]/blocks";


const BLOCK_META = Object.fromEntries(BLOCK_CATALOGUE.map((b) => [b.type, b])) as Record<string, (typeof BLOCK_CATALOGUE)[number]>;

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
      </div>

      {/* Topic tags */}
      {activity.topicTags && activity.topicTags.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-wide text-charcoal-soft">Topics:</span>
          {activity.topicTags.map((tag) => (
            <span key={tag} className="rounded-full bg-forest-100 px-2 py-0.5 text-[10px] font-semibold text-forest-700 capitalize">{tag}</span>
          ))}
        </div>
      )}

      {/* Block type chips */}
      {activity.blocks.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(blockTypeCounts).map(([type, count]) => {
            const meta = BLOCK_META[type];
            return (
              <span
                key={type}
                className="inline-flex items-center gap-1 rounded-full bg-cream px-2.5 py-1 text-[0.65rem] font-medium text-charcoal-soft ring-1 ring-black/8"
              >
                {meta?.icon}
                {count > 1 ? `${count}× ` : ""}{meta?.label ?? type}
              </span>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-2 border-t border-sand pt-3">
        <Button size="sm" onClick={onEdit} className="flex-1">
          <Pencil className="h-3.5 w-3.5" /> Edit
        </Button>
        <a
          href={`/teacher/print/activity/${activity.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl p-2 text-charcoal-soft transition hover:bg-forest-50 hover:text-forest-700"
          aria-label="Print worksheet"
        >
          <Printer className="h-4 w-4" />
        </a>
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
    return <FullPageLoader />;
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

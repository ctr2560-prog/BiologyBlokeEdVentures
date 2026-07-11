"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { SectionHeader, Button, Modal, Badge, EmptyState } from "@/components/ui/primitives";
import { LessonForm } from "@/components/forms/ContentForms";
import { getTopics } from "@/lib/supabaseService";
import { BookOpen, Plus, Film, CircleHelp, Loader, Pencil } from "lucide-react";
import type { Topic } from "@/types";

export default function LessonsPage() {
  const [lessons, setLessons] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    const data = await getTopics();
    setLessons(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

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
        title="Lessons"
        subtitle="Build standalone lessons with videos, quizzes and adaptive activities. Allocate them to units from the Units page."
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden /> Create lesson
          </Button>
        }
      />

      {lessons.length === 0 ? (
        <EmptyState
          Icon={BookOpen}
          title="No lessons yet"
          message="Create your first lesson to start building content."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden /> Create lesson
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lessons.map((lesson) => (
            <div
              key={lesson.id}
              className="flex flex-col gap-3 rounded-3xl bg-white p-5 shadow-soft ring-1 ring-black/5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="display font-bold text-forest-900 leading-tight">{lesson.title}</h3>
                  {lesson.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-charcoal-soft">
                      {lesson.description}
                    </p>
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
              </div>

              <div className="flex items-center gap-3 text-xs text-charcoal-soft">
                <span className="flex items-center gap-1">
                  <Film className="h-3.5 w-3.5" aria-hidden />
                  {lesson.videoIds.length} video{lesson.videoIds.length !== 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1">
                  <CircleHelp className="h-3.5 w-3.5" aria-hidden />
                  {lesson.quizIds.length} quiz{lesson.quizIds.length !== 1 ? "zes" : ""}
                </span>
              </div>

              <Link
                href={`/admin/lessons/${lesson.id}`}
                className="mt-auto flex items-center justify-center gap-1.5 rounded-full bg-forest-700 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-800 transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden /> Build lesson
              </Link>
            </div>
          ))}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create lesson" maxWidth="max-w-lg">
        <LessonForm
          onSaved={(lesson) => {
            setLessons((prev) => [lesson, ...prev]);
            setCreateOpen(false);
          }}
        />
      </Modal>
    </div>
  );
}

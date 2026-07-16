"use client";
/*
 * Full-screen slide deck for the projector — lets a teacher present a
 * lesson's slides to the class at any time, even when the lesson itself is
 * running student-led on their devices.
 */
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, EmptyState } from "@/components/ui/primitives";
import { getTopic } from "@/lib/supabaseService";
import { toSlidesEmbedUrl } from "@/lib/slides";
import { X, Presentation, Loader } from "lucide-react";
import type { Topic } from "@/types";

export default function PresentSlidesPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = use(params);
  const router = useRouter();
  const [lesson, setLesson] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTopic(lessonId).then((t) => {
      setLesson(t);
      setLoading(false);
    });
  }, [lessonId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest-950">
        <Loader className="h-8 w-8 animate-spin text-forest-400" />
      </div>
    );
  }

  const embed = lesson?.slidesUrl ? toSlidesEmbedUrl(lesson.slidesUrl) : null;

  if (!lesson || !embed) {
    return (
      <EmptyState
        Icon={Presentation}
        title="No slides for this lesson"
        message="Attach a Canva or Google Slides link in the lesson builder first."
        action={
          <Link href="/teacher/library">
            <Button>Back to library</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-forest-950">
      <div className="flex shrink-0 items-center gap-3 px-4 py-3">
        <button
          onClick={() => router.back()}
          aria-label="Exit slides"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-cream backdrop-blur transition-colors hover:bg-white/20"
        >
          <X className="h-4 w-4" />
        </button>
        <Presentation className="h-4 w-4 text-gold-400" aria-hidden />
        <p className="truncate text-sm font-semibold text-cream">{lesson.title}</p>
      </div>
      <div className="min-h-0 flex-1 px-4 pb-4">
        <iframe
          src={embed}
          className="h-full w-full rounded-2xl bg-forest-950 ring-1 ring-white/10"
          allow="fullscreen"
        />
      </div>
    </div>
  );
}

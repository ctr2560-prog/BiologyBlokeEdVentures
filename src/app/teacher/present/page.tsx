"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { SectionHeader, EmptyState } from "@/components/ui/primitives";
import { getClassesByTeacher } from "@/lib/supabaseService";
import { DEMO_TEACHER_ID } from "@/data/people";
import type { ClassGroup } from "@/types";
import { Presentation, Loader, Users } from "lucide-react";

export default function PresentIndexPage() {
  const { currentUser } = useApp();
  const teacherId = currentUser?.id ?? DEMO_TEACHER_ID;

  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getClassesByTeacher(teacherId).then((cls) => {
      setClasses(cls);
      setLoading(false);
    });
  }, [teacherId]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Present mode"
        subtitle="Project a topic to your class — watch, react, quiz, and worksheet in one flow"
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-3xl bg-charcoal/8" />
          ))}
        </div>
      ) : classes.length === 0 ? (
        <EmptyState
          title="No classes yet"
          message="Create a class first, then come back to run a present session."
          action={
            <Link
              href="/teacher/classes"
              className="inline-flex items-center gap-2 rounded-2xl bg-forest-700 px-4 py-2.5 text-sm font-semibold text-cream hover:bg-forest-600"
            >
              <Users className="h-4 w-4" aria-hidden /> Go to My Classes
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => (
            <Link
              key={cls.id}
              href={`/teacher/present/${cls.id}`}
              className="card-lift overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-black/5"
            >
              <div
                className="flex h-28 items-center justify-center"
                style={{ background: "linear-gradient(135deg, #2c5844, #4f9776)" }}
              >
                <Presentation
                  className="h-10 w-10 text-cream/90"
                  aria-hidden
                  strokeWidth={1.5}
                />
              </div>
              <div className="p-4">
                <p className="font-semibold text-forest-900">{cls.name}</p>
                <p className="mt-0.5 text-sm text-charcoal-soft">{cls.yearGroup}</p>
                <p className="mt-3 text-sm font-semibold text-forest-700">
                  Start presenting →
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 text-sm text-charcoal-soft">
        <Loader className="h-4 w-4 shrink-0 text-forest-400" aria-hidden />
        <span>
          Present mode projects to a screen — students use printed worksheets prepared in advance.
        </span>
      </div>
    </div>
  );
}

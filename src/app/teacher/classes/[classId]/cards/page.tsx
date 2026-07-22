"use client";
import { FullPageLoader } from "@/components/ui/BrandLoader";
/*
 * Printable explorer cards. One card per student alias (animal + class code),
 * designed to print cleanly so a teacher can cut and hand them out.
 * The animal-to-child mapping only exists once the teacher writes a name on
 * the back - never in the app.
 */
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { SectionHeader, Button, EmptyState } from "@/components/ui/primitives";
import { getClass, getStudentsByClass } from "@/lib/supabaseService";
import { getAnimal } from "@/data/animals";
import { getAnimalColor } from "@/lib/icons";
import { Printer, ArrowLeft } from "lucide-react";
import type { ClassGroup, User } from "@/types";

export default function ExplorerCardsPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = use(params);

  const [cls, setCls] = useState<ClassGroup | null>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getClass(classId), getStudentsByClass(classId)]).then(([c, s]) => {
      setCls(c);
      setStudents(s);
      setLoading(false);
    });
  }, [classId]);

  if (loading) {
    return <FullPageLoader />;
  }

  if (!cls) {
    return <EmptyState title="Class not found" message="This class may have been removed." />;
  }

  return (
    <div className="space-y-6">
      {/* Screen-only controls */}
      <div className="no-print space-y-4">
        <Link
          href={`/teacher/classes/${cls.id}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-forest-700 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back to class
        </Link>
        <SectionHeader
          title="Explorer cards"
          subtitle={`${cls.name} · ${students.length} explorers. Print, cut out and hand one to each student.`}
          action={
            <Button onClick={() => window.print()}>
              <Printer className="h-4 w-4" aria-hidden /> Print
            </Button>
          }
        />
      </div>

      {/* Card grid (this is what prints) */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {students.map((s) => {
          const animal = getAnimal(s.animalId ?? "");
          if (!animal) return null;
          const color = getAnimalColor(animal.id);
          return (
            <div
              key={s.id}
              className="print-card overflow-hidden rounded-2xl border bg-white text-center shadow-soft"
              style={{ borderTop: `6px solid ${color}` }}
            >
              <div className="p-5">
                <div
                  className="mx-auto h-16 w-16 overflow-hidden rounded-full ring-2"
                  style={{ borderColor: color }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={animal.image} alt={animal.name} className="h-full w-full object-cover" />
                </div>
                <h3 className="display mt-3 text-xl font-bold text-forest-900">{animal.name}</h3>
                <p className="mt-0.5 text-xs text-charcoal-soft">{cls.name}</p>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-sand bg-forest-50 py-2 print:bg-white">
                    <p className="text-[0.6rem] font-semibold uppercase tracking-wide text-charcoal-soft">
                      Class code
                    </p>
                    <p className="display text-lg font-bold tracking-widest text-forest-800">
                      {cls.classCode}
                    </p>
                  </div>
                  <div className="rounded-xl border border-sand bg-gold-300/20 py-2 print:bg-white">
                    <p className="text-[0.6rem] font-semibold uppercase tracking-wide text-charcoal-soft">
                      Secret PIN
                    </p>
                    <p className="display text-lg font-bold tracking-widest text-forest-800">
                      {s.pin ?? "—"}
                    </p>
                  </div>
                </div>

                <p className="mt-2 text-[0.65rem] text-charcoal-soft">
                  Enter the code, tap the {animal.name}, then type your PIN.
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <p className="no-print rounded-2xl bg-forest-50 px-4 py-3 text-xs text-forest-800">
        Tip: write each child&apos;s name on the back of their card. That list stays with
        you, so no personal data ever touches the platform.
      </p>
    </div>
  );
}

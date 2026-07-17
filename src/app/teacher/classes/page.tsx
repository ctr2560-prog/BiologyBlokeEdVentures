"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import {
  SectionHeader,
  Button,
  Modal,
  FormField,
  inputClass,
  EmptyState,
} from "@/components/ui/primitives";
import { ClassCard } from "@/components/cards/ContentCards";
import { getClassesByTeacher } from "@/lib/supabaseService";
import { DEMO_TEACHER_ID } from "@/data/people";
import { Printer } from "lucide-react";
import type { ClassGroup } from "@/types";

export default function ClassesPage() {
  const { currentUser } = useApp();
  const teacherId = currentUser?.id ?? DEMO_TEACHER_ID;

  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [name, setName] = useState("");
  const [yearGroup, setYearGroup] = useState("Year 5");
  const [size, setSize] = useState(24);
  const [created, setCreated] = useState<ClassGroup | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState("");

  const load = useCallback(async () => {
    const cls = await getClassesByTeacher(teacherId);
    setClasses(cls);
    setLoading(false);
  }, [teacherId]);

  useEffect(() => { load(); }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setCreateError("");
    try {
      const res = await fetch("/api/teacher/class", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          yearGroup,
          teacherId,
          schoolId: currentUser?.schoolId ?? null,
          size: Math.max(1, Math.min(42, size)),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      // Map the raw DB row to ClassGroup shape
      const raw = data.cls;
      const cls: ClassGroup = {
        id: raw.id,
        name: raw.name,
        yearGroup: raw.year_group,
        teacherId: raw.teacher_id,
        schoolId: raw.school_id ?? "",
        classCode: raw.class_code,
        studentIds: (raw.class_students ?? []).map((r: { student_id: string }) => r.student_id),
        assignedUnitIds: (raw.assignment_topics ?? []).map((r: { topic_id: string }) => r.topic_id),
        silentMode: Boolean(raw.silent_mode),
        headphoneMode: Boolean(raw.headphone_mode),
      };
      setCreated(cls);
      setClasses((prev) => [...prev, cls]);
      setName("");
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="My Classes"
        subtitle="Create classes, share a join code, and assign Edventures"
        action={
          <Button onClick={() => { setModal(true); setCreated(null); }}>
            Create class
          </Button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-3xl bg-charcoal/8" />
          ))}
        </div>
      ) : classes.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c) => (
            <ClassCard
              key={c.id}
              cls={c}
              studentCount={c.studentIds.length}
              href={`/teacher/classes/${c.id}`}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No classes yet"
          message="Create your first class to start assigning wildlife Edventures."
          action={<Button onClick={() => setModal(true)}>Create class</Button>}
        />
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Create a class">
        {created ? (
          <div className="text-center">
            <h3 className="display text-lg font-bold text-forest-900">Class created!</h3>
            <p className="mt-1 text-sm text-charcoal-soft">Share this join code with your students:</p>
            <p className="display mt-3 rounded-2xl bg-forest-700 py-4 text-2xl font-bold tracking-widest text-cream">
              {created.classCode}
            </p>
            <p className="mt-3 text-sm text-charcoal-soft">
              {created.studentIds.length} explorer aliases have been created. Print the
              cards and hand them out, no names needed.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Link href={`/teacher/classes/${created.id}/cards`}>
                <Button variant="secondary">
                  <Printer className="h-4 w-4" aria-hidden /> Print explorer cards
                </Button>
              </Link>
              <Link href={`/teacher/classes/${created.id}`}>
                <Button>Open class</Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <FormField label="Class name" required>
              <input
                className={inputClass}
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. 5J Science Explorers"
              />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Year group">
                <select
                  className={inputClass}
                  value={yearGroup}
                  onChange={(e) => setYearGroup(e.target.value)}
                >
                  {["Year 5", "Year 6", "Year 7", "Year 8", "Year 9", "Year 10"].map((y) => (
                    <option key={y}>{y}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Number of students" hint="Up to 42">
                <input
                  type="number"
                  min={1}
                  max={42}
                  className={inputClass}
                  value={size}
                  onChange={(e) => setSize(+e.target.value)}
                />
              </FormField>
            </div>
            <p className="rounded-2xl bg-forest-50 px-4 py-3 text-xs text-forest-800">
              Each student gets a unique animal alias and a join code. No names or personal
              data, ever - the animal-to-child list stays with you.
            </p>
            {createError && (
              <p className="rounded-2xl bg-clay-400/10 px-4 py-3 text-sm font-medium text-clay-600">
                {createError}
              </p>
            )}
            <div className="flex justify-end">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Create class"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

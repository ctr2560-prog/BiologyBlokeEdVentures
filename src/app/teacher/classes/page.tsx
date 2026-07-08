"use client";
import { useMemo, useState } from "react";
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
import { getClassesByTeacher, getStudentsByClass, createClass } from "@/lib/dataService";
import { DEMO_TEACHER_ID } from "@/data/people";
import { Printer } from "lucide-react";

export default function ClassesPage() {
  const { currentUser, version, bump } = useApp();
  const teacherId = currentUser?.id ?? DEMO_TEACHER_ID;
  const [modal, setModal] = useState(false);
  const [name, setName] = useState("");
  const [yearGroup, setYearGroup] = useState("Year 5");
  const [size, setSize] = useState(24);
  const [created, setCreated] = useState<string | null>(null);

  const classes = useMemo(() => {
    void version;
    return getClassesByTeacher(teacherId);
  }, [version, teacherId]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const cls = createClass(
      {
        name,
        yearGroup,
        teacherId,
        schoolId: currentUser?.schoolId ?? "school-srhs",
      },
      Math.max(1, Math.min(42, size))
    );
    bump();
    setCreated(cls.id);
    setName("");
  };

  const createdClass = useMemo(() => {
    void version;
    return created ? getClassesByTeacher(teacherId).find((c) => c.id === created) : null;
  }, [created, teacherId, version]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="My Classes"
        subtitle="Create classes, share a join code, and assign Edventures"
        action={<Button onClick={() => { setModal(true); setCreated(null); }}> Create class</Button>}
      />

      {classes.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c) => (
            <ClassCard key={c.id} cls={c} studentCount={getStudentsByClass(c.id).length} href={`/teacher/classes/${c.id}`} />
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
        {createdClass ? (
          <div className="text-center">
            <h3 className="display text-lg font-bold text-forest-900">Class created!</h3>
            <p className="mt-1 text-sm text-charcoal-soft">Share this join code with your students:</p>
            <p className="display mt-3 rounded-2xl bg-forest-700 py-4 text-2xl font-bold tracking-widest text-cream">
              {createdClass.classCode}
            </p>
            <p className="mt-3 text-sm text-charcoal-soft">
              {createdClass.studentIds.length} explorer aliases have been created. Print the
              cards and hand them out, no names needed.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Link href={`/teacher/classes/${createdClass.id}/cards`}>
                <Button variant="secondary"><Printer className="h-4 w-4" aria-hidden /> Print explorer cards</Button>
              </Link>
              <Link href={`/teacher/classes/${createdClass.id}`}>
                <Button>Open class</Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <FormField label="Class name" required>
              <input className={inputClass} required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. 5J Science Explorers" />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Year group">
                <select className={inputClass} value={yearGroup} onChange={(e) => setYearGroup(e.target.value)}>
                  {["Year 5", "Year 6", "Year 7", "Year 8", "Year 9", "Year 10"].map((y) => (
                    <option key={y}>{y}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Number of students" hint="Up to 42">
                <input type="number" min={1} max={42} className={inputClass} value={size} onChange={(e) => setSize(+e.target.value)} />
              </FormField>
            </div>
            <p className="rounded-2xl bg-forest-50 px-4 py-3 text-xs text-forest-800">
              Each student gets a unique animal alias and a join code. No names or personal
              data, ever, the animal-to-child list stays with you.
            </p>
            <div className="flex justify-end">
              <Button type="submit">Create class</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

"use client";
import { useMemo, useState } from "react";
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

export default function ClassesPage() {
  const { currentUser, version, bump } = useApp();
  const teacherId = currentUser?.id ?? DEMO_TEACHER_ID;
  const [modal, setModal] = useState(false);
  const [name, setName] = useState("");
  const [yearGroup, setYearGroup] = useState("Year 5");
  const [created, setCreated] = useState<string | null>(null);

  const classes = useMemo(() => {
    void version;
    return getClassesByTeacher(teacherId);
  }, [version, teacherId]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const cls = createClass({
      name,
      yearGroup,
      teacherId,
      schoolId: currentUser?.schoolId ?? "school-srhs",
    });
    bump();
    setCreated(cls.classCode);
    setName("");
  };

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
        {created ? (
          <div className="text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-forest-50 text-3xl"></div>
            <h3 className="display mt-3 text-lg font-bold text-forest-900">Class created!</h3>
            <p className="mt-1 text-sm text-charcoal-soft">Share this join code with your students:</p>
            <p className="display mt-3 rounded-2xl bg-forest-700 py-4 text-2xl font-bold tracking-widest text-cream">
              {created}
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <Button variant="secondary" onClick={() => setCreated(null)}>Create another</Button>
              <Button onClick={() => setModal(false)}>Done</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <FormField label="Class name" required>
              <input className={inputClass} required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. 5J Science Explorers" />
            </FormField>
            <FormField label="Year group">
              <select className={inputClass} value={yearGroup} onChange={(e) => setYearGroup(e.target.value)}>
                {["Year 5", "Year 6", "Year 7", "Year 8", "Year 9", "Year 10"].map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
            </FormField>
            <p className="rounded-2xl bg-forest-50 px-4 py-3 text-xs text-forest-800">
              A unique join code is generated automatically. Students enter it to join -
              no personal data required.
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

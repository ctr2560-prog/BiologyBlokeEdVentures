"use client";
import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import {
  SectionHeader,
  Button,
  Badge,
  Modal,
  FormField,
  inputClass,
  EmptyState,
} from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Leaf } from "lucide-react";
import { EngagementPill } from "@/components/cards/InsightCards";
import {
  getClass,
  getStudentsByClass,
  getUnit,
  getProgressByStudent,
  db,
  newId,
} from "@/lib/dataService";
import type { User } from "@/types";

export default function ClassDetailPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = use(params);
  const { version, bump } = useApp();
  const [addOpen, setAddOpen] = useState(false);
  const [studentName, setStudentName] = useState("");

  const cls = useMemo(() => {
    void version;
    return getClass(classId);
  }, [version, classId]);
  const students = useMemo(() => {
    void version;
    return getStudentsByClass(classId);
  }, [version, classId]);

  if (!cls) {
    return <EmptyState title="Class not found" message="This class may have been removed." />;
  }

  const addStudent = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock student creation, minimal PII, class-linked only.
    const id = newId("stu");
    const student: User = {
      id,
      name: studentName,
      email: `${studentName.toLowerCase().replace(/\s+/g, "")}@student.demo`,
      role: "student",
      schoolId: cls.schoolId,
      classIds: [cls.id],
      createdAt: new Date().toISOString().slice(0, 10),
    };
    db.users.push(student);
    cls.studentIds.push(id);
    bump();
    setStudentName("");
    setAddOpen(false);
  };

  const removeStudent = (id: string) => {
    cls.studentIds = cls.studentIds.filter((s) => s !== id);
    bump();
  };

  const columns: Column<User>[] = [
    {
      key: "name",
      header: "Student",
      render: (s) => (
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-forest-100 text-sm font-bold text-forest-800">
            {s.name.slice(0, 1)}
          </span>
          <span className="font-semibold text-forest-900">{s.name}</span>
        </div>
      ),
    },
    {
      key: "activity",
      header: "Reels watched",
      align: "center",
      render: (s) => getProgressByStudent(s.id).length,
    },
    {
      key: "engagement",
      header: "Engagement",
      align: "center",
      render: (s) => {
        const rows = getProgressByStudent(s.id);
        const level = rows[0]?.engagementLevel ?? "medium";
        return rows.length ? <EngagementPill level={level} /> : <span className="text-charcoal-soft">-</span>;
      },
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (s) => (
        <button onClick={() => removeStudent(s.id)} className="text-sm text-clay-500 hover:text-clay-600">
          Remove
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Link href="/teacher/classes" className="text-sm font-semibold text-forest-700 hover:underline">
         All classes
      </Link>
      <SectionHeader
        title={cls.name}
        subtitle={`${cls.yearGroup} · ${students.length} students`}
        action={
          <div className="flex gap-2">
            <Link href={`/teacher/assign?class=${cls.id}`}>
              <Button variant="secondary"> Assign lesson</Button>
            </Link>
            <Button onClick={() => setAddOpen(true)}> Add student</Button>
          </div>
        }
      />

      {/* Class code + assigned units */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-black/5">
          <p className="text-xs font-semibold uppercase tracking-wide text-charcoal-soft">Join code</p>
          <p className="display mt-1 text-2xl font-bold tracking-widest text-forest-800">{cls.classCode}</p>
          <p className="mt-1 text-xs text-charcoal-soft">Students enter this to join the class.</p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-black/5">
          <p className="text-xs font-semibold uppercase tracking-wide text-charcoal-soft">Assigned units</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {cls.assignedUnitIds.length ? (
              cls.assignedUnitIds.map((u) => (
                <Badge key={u} tone="forest">
                  <Leaf className="h-3 w-3" aria-hidden /> {getUnit(u)?.title}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-charcoal-soft">None yet, assign a lesson to get started.</span>
            )}
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={students}
        keyOf={(s) => s.id}
        empty={<EmptyState title="No students yet" message="Add students or share the join code." action={<Button onClick={() => setAddOpen(true)}>Add student</Button>} />}
      />

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add a student">
        <form onSubmit={addStudent} className="space-y-4">
          <FormField label="Display name" required hint="First name and last initial keeps personal data minimal">
            <input className={inputClass} required value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="e.g. Jordan K." />
          </FormField>
          <div className="flex justify-end">
            <Button type="submit">Add to class</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

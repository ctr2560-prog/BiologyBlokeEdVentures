"use client";
import { use, useMemo } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { SectionHeader, Button, Badge, EmptyState } from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { AliasChip } from "@/components/ui/AliasChip";
import { EngagementPill } from "@/components/cards/InsightCards";
import { Leaf, Printer, Plus } from "lucide-react";
import {
  getClass,
  getStudentsByClass,
  getUnit,
  getProgressByStudent,
  addAlias,
} from "@/lib/dataService";
import type { User } from "@/types";

export default function ClassDetailPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = use(params);
  const { version, bump } = useApp();

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

  const addExplorer = () => {
    addAlias(cls.id);
    bump();
  };

  const removeStudent = (id: string) => {
    cls.studentIds = cls.studentIds.filter((s) => s !== id);
    bump();
  };

  const columns: Column<User>[] = [
    {
      key: "name",
      header: "Explorer",
      render: (s) => <AliasChip user={s} />,
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
        subtitle={`${cls.yearGroup} · ${students.length} explorers`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href={`/teacher/classes/${cls.id}/cards`}>
              <Button variant="secondary"><Printer className="h-4 w-4" aria-hidden /> Explorer cards</Button>
            </Link>
            <Link href={`/teacher/assign?class=${cls.id}`}>
              <Button variant="secondary">Assign lesson</Button>
            </Link>
            <Button onClick={addExplorer}><Plus className="h-4 w-4" aria-hidden /> Add explorer</Button>
          </div>
        }
      />

      {/* Join code + assigned units */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-black/5">
          <p className="text-xs font-semibold uppercase tracking-wide text-charcoal-soft">Join code</p>
          <p className="display mt-1 text-2xl font-bold tracking-widest text-forest-800">{cls.classCode}</p>
          <p className="mt-1 text-xs text-charcoal-soft">Students enter this, then tap their animal.</p>
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
        empty={<EmptyState title="No explorers yet" message="Add explorers or share the join code." action={<Button onClick={addExplorer}>Add explorer</Button>} />}
      />
    </div>
  );
}

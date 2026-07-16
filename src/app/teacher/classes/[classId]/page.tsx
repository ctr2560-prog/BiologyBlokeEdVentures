"use client";
import { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { SectionHeader, Button, Badge, EmptyState } from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { AliasChip } from "@/components/ui/AliasChip";
import { EngagementPill } from "@/components/cards/InsightCards";
import { Leaf, Printer, Plus, MonitorPlay, ClipboardList } from "lucide-react";
import {
  getClass,
  getStudentsByClass,
  getUnit,
  getProgressByClass,
  addAlias,
  removeStudentFromClass,
  getResponsesByClass,
  getActivity,
} from "@/lib/supabaseService";
import type { ClassGroup, User, Unit, StudentProgress, StudentActivityResponse, Activity } from "@/types";

export default function ClassDetailPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = use(params);

  const [cls, setCls] = useState<ClassGroup | null>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [allProgress, setAllProgress] = useState<StudentProgress[]>([]);
  const [unitMap, setUnitMap] = useState<Map<string, Unit>>(new Map());
  const [activityResponses, setActivityResponses] = useState<StudentActivityResponse[]>([]);
  const [activityMap, setActivityMap] = useState<Map<string, Activity>>(new Map());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [clsData, studentsData, progressData, responsesData] = await Promise.all([
      getClass(classId),
      getStudentsByClass(classId),
      getProgressByClass(classId),
      getResponsesByClass(classId),
    ]);
    setCls(clsData);
    setStudents(studentsData);
    setAllProgress(progressData);
    setActivityResponses(responsesData);

    if (clsData?.assignedUnitIds.length) {
      const unitResults = await Promise.all(clsData.assignedUnitIds.map(getUnit));
      const map = new Map<string, Unit>();
      unitResults.forEach((u) => { if (u) map.set(u.id, u); });
      setUnitMap(map);
    }

    const uniqueActivityIds = [...new Set(responsesData.map((r) => r.activityId))];
    const activities = await Promise.all(uniqueActivityIds.map((id) => getActivity(id)));
    const aMap = new Map<string, Activity>();
    activities.forEach((a) => { if (a) aMap.set(a.id, a); });
    setActivityMap(aMap);

    setLoading(false);
  }, [classId]);

  useEffect(() => { load(); }, [load]);

  const handleAddExplorer = async () => {
    if (!cls) return;
    const newStudent = await addAlias(cls.id);
    if (newStudent) {
      setStudents((prev) => [...prev, newStudent]);
      setCls((prev) =>
        prev ? { ...prev, studentIds: [...prev.studentIds, newStudent.id] } : prev
      );
    }
  };

  const handleRemove = async (studentId: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    setCls((prev) =>
      prev ? { ...prev, studentIds: prev.studentIds.filter((id) => id !== studentId) } : prev
    );
    await removeStudentFromClass(classId, studentId);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-4 w-32 animate-pulse rounded-full bg-charcoal/8" />
        <div className="h-10 w-64 animate-pulse rounded-2xl bg-charcoal/8" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-3xl bg-charcoal/8" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-3xl bg-charcoal/8" />
      </div>
    );
  }

  if (!cls) {
    return <EmptyState title="Class not found" message="This class may have been removed." />;
  }

  const progressByStudent = new Map<string, StudentProgress[]>();
  allProgress.forEach((p) => {
    const arr = progressByStudent.get(p.studentId) ?? [];
    arr.push(p);
    progressByStudent.set(p.studentId, arr);
  });

  const columns: Column<User>[] = [
    {
      key: "name",
      header: "Explorer",
      render: (s) => <AliasChip user={s} />,
    },
    {
      key: "pin",
      header: "PIN",
      align: "center",
      render: (s) =>
        s.pin ? (
          <span className="rounded-lg bg-gold-300/25 px-2 py-0.5 font-mono text-sm font-bold tracking-widest text-forest-800">
            {s.pin}
          </span>
        ) : (
          <span className="text-charcoal-soft">-</span>
        ),
    },
    {
      key: "activity",
      header: "Reels watched",
      align: "center",
      render: (s) => (progressByStudent.get(s.id) ?? []).length,
    },
    {
      key: "engagement",
      header: "Engagement",
      align: "center",
      render: (s) => {
        const rows = progressByStudent.get(s.id) ?? [];
        const level = rows[0]?.engagementLevel ?? "medium";
        return rows.length ? (
          <EngagementPill level={level} />
        ) : (
          <span className="text-charcoal-soft">-</span>
        );
      },
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (s) => (
        <button
          onClick={() => handleRemove(s.id)}
          className="text-sm text-clay-500 hover:text-clay-600"
        >
          Remove
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Link
        href="/teacher/classes"
        className="text-sm font-semibold text-forest-700 hover:underline"
      >
        All classes
      </Link>
      <SectionHeader
        title={cls.name}
        subtitle={`${cls.yearGroup} · ${students.length} explorers`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href={`/teacher/present/${cls.id}`}>
              <Button variant="secondary">
                <MonitorPlay className="h-4 w-4" aria-hidden /> Present
              </Button>
            </Link>
            <Link href={`/teacher/classes/${cls.id}/cards`}>
              <Button variant="secondary">
                <Printer className="h-4 w-4" aria-hidden /> Explorer cards
              </Button>
            </Link>
            <Link href={`/teacher/assign?class=${cls.id}`}>
              <Button variant="secondary">Assign lesson</Button>
            </Link>
            <Button onClick={handleAddExplorer}>
              <Plus className="h-4 w-4" aria-hidden /> Add explorer
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-black/5">
          <p className="text-xs font-semibold uppercase tracking-wide text-charcoal-soft">Join code</p>
          <p className="display mt-1 text-2xl font-bold tracking-widest text-forest-800">
            {cls.classCode}
          </p>
          <p className="mt-1 text-xs text-charcoal-soft">Students enter this, then tap their animal.</p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-black/5">
          <p className="text-xs font-semibold uppercase tracking-wide text-charcoal-soft">Assigned units</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {cls.assignedUnitIds.length ? (
              cls.assignedUnitIds.map((uid) => (
                <Badge key={uid} tone="forest">
                  <Leaf className="h-3 w-3" aria-hidden /> {unitMap.get(uid)?.title ?? uid}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-charcoal-soft">
                None yet - assign a lesson to get started.
              </span>
            )}
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={students}
        keyOf={(s) => s.id}
        empty={
          <EmptyState
            title="No explorers yet"
            message="Add explorers or share the join code."
            action={<Button onClick={handleAddExplorer}>Add explorer</Button>}
          />
        }
      />

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-forest-600" aria-hidden />
          <h2 className="display text-lg font-bold text-forest-900">Activity responses</h2>
        </div>
        {activityResponses.length === 0 ? (
          <p className="text-sm text-charcoal-soft">No activity responses yet — they appear here once students submit work.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {[...new Set(activityResponses.map((r) => r.activityId))].map((actId) => {
              const resps = activityResponses.filter((r) => r.activityId === actId);
              const submitted = resps.filter((r) => r.submittedAt).length;
              const inProgress = resps.filter((r) => !r.submittedAt).length;
              const act = activityMap.get(actId);
              return (
                <div key={actId} className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-black/5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-forest-900">{act?.title ?? "Activity"}</p>
                    <div className="flex shrink-0 gap-1.5">
                      {submitted > 0 && <Badge tone="forest">{submitted} submitted</Badge>}
                      {inProgress > 0 && <Badge tone="gold">{inProgress} in progress</Badge>}
                    </div>
                  </div>
                  <div className="mt-4">
                    <Link href={`/teacher/classes/${classId}/activity/${actId}`}>
                      <Button variant="secondary" className="w-full">View responses →</Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

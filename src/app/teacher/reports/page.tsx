"use client";
import { Suspense, useState } from "react";
import { useApp } from "@/lib/store";
import { SectionHeader, Button, Badge } from "@/components/ui/primitives";
import {
  getClassesByTeacher,
  getStudentsByClass,
  getProgressByStudent,
  getUser,
} from "@/lib/dataService";
import { getClassAnalytics, formatWatchTime } from "@/lib/analytics";
import { DEMO_TEACHER_ID } from "@/data/people";

function ReportsInner() {
  const { currentUser } = useApp();
  const teacherId = currentUser?.id ?? DEMO_TEACHER_ID;
  const classes = getClassesByTeacher(teacherId);
  const [classId, setClassId] = useState(classes[0]?.id ?? "");

  const cls = classes.find((c) => c.id === classId);
  const students = getStudentsByClass(classId);
  const a = getClassAnalytics(classId);

  const needSupport = students.filter((s) => getProgressByStudent(s.id).some((p) => p.recommendedTaskType === "support"));
  const readyExtension = students.filter((s) => getProgressByStudent(s.id).some((p) => p.recommendedTaskType === "extension"));

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Reports"
        subtitle="A clean class summary you can share or print"
        action={
          <div className="flex gap-2">
            <select className="rounded-2xl border border-sand-dark bg-white px-4 py-2.5 text-sm font-semibold text-forest-900" value={classId} onChange={(e) => setClassId(e.target.value)}>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <Button variant="secondary" onClick={() => window.print()}>🖨 Print / PDF</Button>
          </div>
        }
      />

      {/* Report preview sheet */}
      <div className="rounded-3xl bg-white p-8 shadow-soft ring-1 ring-black/5">
        <div className="flex items-center justify-between border-b border-sand pb-4">
          <div>
            <h2 className="display text-2xl font-bold text-forest-900">{cls?.name}</h2>
            <p className="text-sm text-charcoal-soft">{cls?.yearGroup} · Class report · {new Date().toLocaleDateString()}</p>
          </div>
          <Badge tone="forest">BioBloke Edventures</Badge>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <ReportStat label="Students" value={students.length} />
          <ReportStat label="Avg completion" value={`${a.avgCompletion}%`} />
          <ReportStat label="Avg quiz" value={`${a.avgQuiz}%`} />
          <ReportStat label="Avg watch" value={formatWatchTime(a.avgWatchTime)} />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <ReportSection title="🌟 Topic strengths">
            {a.strengths.length ? (
              <ul className="space-y-1 text-sm text-charcoal">
                {a.strengths.map((t) => <li key={t.topic}>• {t.topic} — {t.avg}% avg</li>)}
              </ul>
            ) : <p className="text-sm text-charcoal-soft">Gathering data.</p>}
          </ReportSection>
          <ReportSection title="🧩 Topic gaps">
            {a.gaps.length ? (
              <ul className="space-y-1 text-sm text-charcoal">
                {a.gaps.map((t) => <li key={t.topic}>• {t.topic} — {t.avg}% avg</li>)}
              </ul>
            ) : <p className="text-sm text-charcoal-soft">No major gaps.</p>}
          </ReportSection>
          <ReportSection title="🪴 Students needing support">
            {needSupport.length ? (
              <ul className="space-y-1 text-sm text-charcoal">
                {needSupport.map((s) => <li key={s.id}>• {s.name}</li>)}
              </ul>
            ) : <p className="text-sm text-charcoal-soft">Everyone on track.</p>}
          </ReportSection>
          <ReportSection title="🚀 Ready for extension">
            {readyExtension.length ? (
              <ul className="space-y-1 text-sm text-charcoal">
                {readyExtension.map((s) => <li key={s.id}>• {s.name}</li>)}
              </ul>
            ) : <p className="text-sm text-charcoal-soft">None yet.</p>}
          </ReportSection>
        </div>

        <div className="mt-8 rounded-2xl bg-forest-50 p-5">
          <h3 className="display font-semibold text-forest-900">📋 Suggested next lesson</h3>
          <p className="mt-1 text-sm text-charcoal">
            {a.gaps.length
              ? `Re-teach ${a.gaps[0].topic} with a scaffolded support task, then move the extension-ready students onto the Wildlife Corridor challenge.`
              : `The class is progressing well — introduce the next topic and enable extension tasks for high performers.`}
          </p>
        </div>
      </div>
    </div>
  );
}

function ReportStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-cream/60 p-4 text-center">
      <p className="display text-2xl font-bold text-forest-900">{value}</p>
      <p className="text-xs text-charcoal-soft">{label}</p>
    </div>
  );
}

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="display mb-2 font-semibold text-forest-900">{title}</h3>
      {children}
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-charcoal-soft">Loading report…</div>}>
      <ReportsInner />
    </Suspense>
  );
}

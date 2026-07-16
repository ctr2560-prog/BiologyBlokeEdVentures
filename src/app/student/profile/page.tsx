"use client";
import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { SectionHeader, Badge, Button, FormField, inputClass } from "@/components/ui/primitives";
import { getBadges } from "@/lib/dataService";
import { getClass, getPointsTotal } from "@/lib/supabaseService";
import { DEMO_STUDENT_ID } from "@/data/people";
import { getBadgeIcon } from "@/lib/icons";
import type { ClassGroup } from "@/types";

export default function StudentProfile() {
  const { currentUser } = useApp();
  const studentId = currentUser?.id ?? DEMO_STUDENT_ID;

  const [cls, setCls] = useState<ClassGroup | null>(null);
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const classId = currentUser?.classIds?.[0];
      const [classData, total] = await Promise.all([
        classId ? getClass(classId) : Promise.resolve(null),
        getPointsTotal(studentId),
      ]);
      setCls(classData);
      setPoints(total);
      setLoading(false);
    }
    load();
  }, [studentId, currentUser]);

  const allBadges = getBadges();
  const myBadges = allBadges.filter((b) => points >= b.pointsRequired);
  const studentName = currentUser?.name ?? "Explorer";

  return (
    <div className="space-y-6">
      <SectionHeader title="Profile" subtitle="Your explorer identity" />

      {/* Explorer card */}
      <div className="overflow-hidden rounded-3xl shadow-hero">
        <div className="flex items-center gap-5 p-8 text-cream" style={{ background: "linear-gradient(120deg, #2c5844, #4f9776)" }}>
          <span className="grid h-20 w-20 place-items-center rounded-3xl bg-cream text-4xl font-bold text-forest-800">
            {studentName.slice(0, 1)}
          </span>
          <div>
            <h2 className="display text-2xl font-bold">{studentName}</h2>
            <p className="text-forest-100/90">
              {cls ? `${cls.name} · ${cls.yearGroup}` : loading ? "Loading…" : "No class"}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="glass rounded-full px-3 py-1 text-sm font-semibold text-forest-900">
                {points} points
              </span>
              <span className="glass rounded-full px-3 py-1 text-sm font-semibold text-forest-900">
                {myBadges.length} badges
              </span>
            </div>
          </div>
        </div>
        <div className="bg-white p-5">
          <p className="text-sm font-semibold text-forest-900">Badges earned</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {myBadges.length ? (
              myBadges.map((b) => {
                const I = getBadgeIcon(b.id);
                return (
                  <span
                    key={b.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-forest-50 px-3 py-1.5 text-sm font-medium text-forest-800"
                  >
                    <I className="h-4 w-4" aria-hidden /> {b.name}
                  </span>
                );
              })
            ) : (
              <span className="text-sm text-charcoal-soft">
                Complete lessons to earn your first badge!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-4 rounded-3xl bg-white p-6 shadow-soft ring-1 ring-black/5">
          <h3 className="display text-lg font-bold text-forest-900">Account</h3>
          <FormField label="Display name" hint="Kept short to protect your privacy">
            <input className={inputClass} defaultValue={studentName} />
          </FormField>
          <FormField label="Class code">
            <input className={inputClass} defaultValue={cls?.classCode ?? ""} disabled />
          </FormField>
          <Button>Save</Button>
        </div>
        <div className="rounded-3xl bg-mist-100 p-6 ring-1 ring-mist-400/40">
          <h3 className="display text-lg font-bold text-forest-900">Your privacy</h3>
          <p className="mt-2 text-sm text-charcoal">
            BioBloke only stores your display name and the class you joined. We never
            collect unnecessary personal information. Your progress is used to help you
            learn, only you and your teacher can see it.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="mist">Minimal data</Badge>
            <Badge tone="mist">Teacher-only visibility</Badge>
            <Badge tone="mist">No ads</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

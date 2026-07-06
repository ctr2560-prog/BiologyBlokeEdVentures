"use client";
import { useApp } from "@/lib/store";
import { SectionHeader, FormField, inputClass, Button } from "@/components/ui/primitives";
import { InsightCard } from "@/components/cards/InsightCards";
import { getSchool } from "@/lib/dataService";
import { DEMO_TEACHER_ID } from "@/data/people";
import { getUser } from "@/lib/dataService";

export default function TeacherSettings() {
  const { currentUser } = useApp();
  const teacher = currentUser ?? getUser(DEMO_TEACHER_ID);
  const school = getSchool(teacher?.schoolId ?? "");

  return (
    <div className="space-y-6">
      <SectionHeader title="Settings" subtitle="Your profile and class preferences" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-4 rounded-3xl bg-white p-6 shadow-soft ring-1 ring-black/5">
          <h3 className="display text-lg font-bold text-forest-900">Profile</h3>
          <FormField label="Name">
            <input className={inputClass} defaultValue={teacher?.name} />
          </FormField>
          <FormField label="Email">
            <input className={inputClass} defaultValue={teacher?.email} />
          </FormField>
          <FormField label="School">
            <input className={inputClass} defaultValue={school?.name} disabled />
          </FormField>
          <Button>Save changes</Button>
        </div>
        <div className="space-y-4">
          <InsightCard title="Default lesson settings" tone="forest">
            New assignments default to <b>adaptive tasks on</b> and <b>explorer points on</b>.
            You can change these per assignment.
          </InsightCard>
          <InsightCard title="Your data access" tone="mist">
            You can only see your own classes and their students. Other teachers&apos; classes
            and platform-wide analytics are not visible to you, enforced by role-based rules.
          </InsightCard>
        </div>
      </div>
    </div>
  );
}

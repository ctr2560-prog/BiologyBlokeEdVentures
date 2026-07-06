"use client";
import { SectionHeader, Button, Badge, FormField, inputClass } from "@/components/ui/primitives";
import { InsightCard } from "@/components/cards/InsightCards";

export default function AdminSettings() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Settings" subtitle="Platform configuration & brand" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-4 rounded-3xl bg-white p-6 shadow-soft ring-1 ring-black/5">
          <h3 className="display text-lg font-bold text-forest-900">Platform</h3>
          <FormField label="Platform name">
            <input className={inputClass} defaultValue="BioBloke Edventures" />
          </FormField>
          <FormField label="Support email">
            <input className={inputClass} defaultValue="thebiologybloke@gmail.com" />
          </FormField>
          <FormField label="Default stage">
            <select className={inputClass} defaultValue="Stage 3">
              <option>Stage 3</option>
              <option>Stage 4</option>
              <option>Stage 5</option>
            </select>
          </FormField>
          <Button>Save changes</Button>
        </div>

        <div className="space-y-4">
          <InsightCard title="Data & privacy" tone="mist">
            Student records store display name and class linkage only. Analytics measure
            learning engagement, never location, behaviour tracking, or unnecessary PII.
          </InsightCard>
          <InsightCard title="Roles & access" tone="forest">
            <div className="space-y-1.5">
              <p> <b>Admin</b>, full ecosystem management & platform analytics</p>
              <p> <b>Teacher</b>, only their own classes & those students</p>
              <p> <b>Student</b>, only their own progress & assigned work</p>
            </div>
            <p className="mt-2 text-xs">Enforced via Firebase Auth custom claims + Firestore rules once connected.</p>
          </InsightCard>
          <InsightCard title="Integrations" tone="gold">
            <div className="flex flex-wrap gap-2">
              <Badge tone="neutral">Firebase Auth · planned</Badge>
              <Badge tone="neutral">Firestore · planned</Badge>
              <Badge tone="neutral">Storage · planned</Badge>
              <Badge tone="neutral">YouTube API · planned</Badge>
            </div>
          </InsightCard>
        </div>
      </div>
    </div>
  );
}

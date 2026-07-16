"use client";
import { SectionHeader } from "@/components/ui/primitives";
import { ClipboardList } from "lucide-react";

export default function FeedbackPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Feedback"
        subtitle="Survey responses from teachers and students — coming soon"
      />
      <div className="rounded-3xl bg-white p-12 text-center shadow-soft ring-1 ring-black/5">
        <ClipboardList className="mx-auto h-12 w-12 text-charcoal-soft/30" strokeWidth={1.5} />
        <h3 className="display mt-4 text-lg font-bold text-forest-900">Surveys coming soon</h3>
        <p className="mt-2 max-w-sm mx-auto text-sm text-charcoal-soft">
          This is where teacher and student survey responses will appear for your PhD research.
          Surveys and data collection will be wired up here when you're ready.
        </p>
      </div>
    </div>
  );
}

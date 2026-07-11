"use client";
import { useEffect, useState } from "react";
import { SectionHeader, Badge, EmptyState } from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { getSchools } from "@/lib/supabaseService";
import { School as SchoolIcon, Loader } from "lucide-react";
import type { School } from "@/types";

const subTone = { active: "forest", trial: "gold", lapsed: "clay" } as const;

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSchools().then((s) => { setSchools(s); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader className="h-8 w-8 animate-spin text-forest-600" aria-hidden />
      </div>
    );
  }

  const columns: Column<School>[] = [
    {
      key: "name",
      header: "School",
      render: (s) => (
        <div>
          <p className="font-semibold text-forest-900">{s.name}</p>
          <p className="text-xs text-charcoal-soft">{s.location}</p>
        </div>
      ),
    },
    { key: "teachers", header: "Teachers", align: "center", render: (s) => s.teacherIds.length },
    { key: "students", header: "Students", align: "center", render: (s) => s.studentIds.length },
    {
      key: "active",
      header: "Status",
      render: (s) => <Badge tone={s.active ? "forest" : "neutral"}>{s.active ? "Active" : "Inactive"}</Badge>,
    },
    {
      key: "sub",
      header: "Subscription",
      render: (s) => <Badge tone={subTone[s.subscriptionStatus]}>{s.subscriptionStatus}</Badge>,
    },
    {
      key: "last",
      header: "Last active",
      align: "right",
      render: (s) => <span className="text-charcoal-soft">{s.lastActive}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader title="Schools" subtitle="Every school on the platform and their subscription health" />

      {schools.length === 0 ? (
        <EmptyState
          Icon={SchoolIcon}
          title="No schools yet"
          message="Schools will appear here once they sign up."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat label="Total schools" value={schools.length} />
            <Stat label="Active" value={schools.filter((s) => s.active).length} />
            <Stat label="On trial" value={schools.filter((s) => s.subscriptionStatus === "trial").length} />
            <Stat label="Lapsed" value={schools.filter((s) => s.subscriptionStatus === "lapsed").length} />
          </div>
          <DataTable columns={columns} rows={schools} keyOf={(s) => s.id} />
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl bg-white p-4 shadow-soft ring-1 ring-black/5">
      <p className="text-sm text-charcoal-soft">{label}</p>
      <p className="display text-2xl font-bold text-forest-900">{value}</p>
    </div>
  );
}

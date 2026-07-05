"use client";
import { useState } from "react";
import { SectionHeader, Badge, inputClass } from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { getUsers, getSchool, getClass } from "@/lib/dataService";
import type { Role, User } from "@/types";

/** Shared admin view for browsing teachers or students, filterable by school. */
export function UserManagement({
  role,
  title,
  subtitle,
}: {
  role: Role;
  title: string;
  subtitle: string;
}) {
  const [query, setQuery] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("all");

  const all = getUsers().filter((u) => u.role === role);
  const schoolIds = [...new Set(all.map((u) => u.schoolId).filter(Boolean))] as string[];

  const rows = all.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) &&
      (schoolFilter === "all" || u.schoolId === schoolFilter)
  );

  const columns: Column<User>[] = [
    {
      key: "name",
      header: "Name",
      render: (u) => (
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-forest-100 text-sm font-bold text-forest-800">
            {u.name.slice(0, 1)}
          </span>
          <span className="font-semibold text-forest-900">{u.name}</span>
        </div>
      ),
    },
    { key: "email", header: "Email", render: (u) => <span className="text-charcoal-soft">{u.email}</span> },
    { key: "school", header: "School", render: (u) => getSchool(u.schoolId ?? "")?.name ?? "—" },
    {
      key: "classes",
      header: role === "teacher" ? "Classes" : "Class",
      render: (u) => (
        <div className="flex flex-wrap gap-1">
          {u.classIds.map((c) => (
            <Badge key={c} tone="sand">
              {getClass(c)?.name ?? c}
            </Badge>
          ))}
          {u.classIds.length === 0 && <span className="text-charcoal-soft">—</span>}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader title={title} subtitle={subtitle} />
      <div className="flex flex-wrap items-center gap-3 rounded-3xl bg-white p-3 shadow-soft ring-1 ring-black/5">
        <input
          className={`${inputClass} flex-1 min-w-48`}
          placeholder={`🔍 Search ${role}s…`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select className={`${inputClass} w-auto`} value={schoolFilter} onChange={(e) => setSchoolFilter(e.target.value)}>
          <option value="all">All schools</option>
          {schoolIds.map((id) => (
            <option key={id} value={id}>
              {getSchool(id)?.name}
            </option>
          ))}
        </select>
      </div>
      <DataTable columns={columns} rows={rows} keyOf={(u) => u.id} />
    </div>
  );
}

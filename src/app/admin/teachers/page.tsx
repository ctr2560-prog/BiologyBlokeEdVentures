"use client";
import { UserManagement } from "@/components/layout/UserManagement";

export default function TeachersPage() {
  return (
    <UserManagement
      role="teacher"
      title="Teachers"
      subtitle="Staff across all schools, filter by school or search by name"
    />
  );
}

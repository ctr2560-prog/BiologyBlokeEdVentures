"use client";
import { UserManagement } from "@/components/layout/UserManagement";

export default function StudentsPage() {
  return (
    <UserManagement
      role="student"
      title="Students"
      subtitle="Learners across all schools. Minimal personal data is stored — display name and class linkage only."
    />
  );
}

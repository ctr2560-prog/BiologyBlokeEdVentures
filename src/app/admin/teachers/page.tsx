"use client";
import { UserManagement } from "@/components/layout/UserManagement";

export default function TeachersPage() {
  return (
    <UserManagement
      role="teacher"
      title="Users"
      subtitle="All teachers on the platform — name, email, school and assigned classes"
    />
  );
}

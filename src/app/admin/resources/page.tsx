"use client";
import { useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { SectionHeader, Button, Modal } from "@/components/ui/primitives";
import { ResourceCard } from "@/components/cards/ContentCards";
import { ResourceForm } from "@/components/forms/ContentForms";
import { getResources } from "@/lib/dataService";

export default function ResourcesPage() {
  const { version, bump } = useApp();
  const [modal, setModal] = useState(false);
  const resources = useMemo(() => {
    void version;
    return getResources();
  }, [version]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Resources"
        subtitle="Worksheets, guides, activities, extensions and support tasks"
        action={<Button onClick={() => setModal(true)}> Add resource</Button>}
      />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {resources.map((r) => (
          <ResourceCard key={r.id} resource={r} />
        ))}
      </div>
      <Modal open={modal} onClose={() => setModal(false)} title="Add resource" maxWidth="max-w-2xl">
        <ResourceForm
          onSaved={() => {
            bump();
            setModal(false);
          }}
        />
      </Modal>
    </div>
  );
}

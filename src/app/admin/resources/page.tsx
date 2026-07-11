"use client";
import { useEffect, useState } from "react";
import { SectionHeader, Button, Modal, EmptyState } from "@/components/ui/primitives";
import { ResourceCard } from "@/components/cards/ContentCards";
import { ResourceForm } from "@/components/forms/ContentForms";
import { getResources } from "@/lib/supabaseService";
import { FileText, Loader, Plus } from "lucide-react";
import type { Resource } from "@/types";

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(false);

  useEffect(() => {
    getResources().then((r) => { setResources(r); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader className="h-8 w-8 animate-spin text-forest-600" aria-hidden />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Resources"
        subtitle="Worksheets, guides, activities, extensions and support tasks"
        action={
          <Button onClick={() => setModal(true)}>
            <Plus className="h-4 w-4" aria-hidden /> Add resource
          </Button>
        }
      />

      {resources.length === 0 ? (
        <EmptyState
          Icon={FileText}
          title="No resources yet"
          message="Add your first resource to attach it to lessons."
          action={
            <Button onClick={() => setModal(true)}>
              <Plus className="h-4 w-4" aria-hidden /> Add resource
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {resources.map((r) => (
            <ResourceCard key={r.id} resource={r} />
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Add resource" maxWidth="max-w-2xl">
        <ResourceForm
          onSaved={() => {
            setModal(false);
            getResources().then(setResources);
          }}
        />
      </Modal>
    </div>
  );
}

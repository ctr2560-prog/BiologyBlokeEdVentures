"use client";
import { useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { SectionHeader, Button, Modal } from "@/components/ui/primitives";
import { VideoCard } from "@/components/cards/ContentCards";
import { VideoForm } from "@/components/forms/ContentForms";
import { getVideos } from "@/lib/dataService";

export default function VideosPage() {
  const { version, bump } = useApp();
  const [modal, setModal] = useState(false);
  const videos = useMemo(() => {
    void version;
    return getVideos();
  }, [version]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Videos"
        subtitle="Short-form wildlife reels, the heart of every Edventure"
        action={<Button onClick={() => setModal(true)}> Add video</Button>}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((v) => (
          <VideoCard key={v.id} video={v} href={`/admin/analytics?video=${v.id}`} />
        ))}
      </div>
      <Modal open={modal} onClose={() => setModal(false)} title="Add video" maxWidth="max-w-2xl">
        <VideoForm
          onSaved={() => {
            bump();
            setModal(false);
          }}
        />
      </Modal>
    </div>
  );
}

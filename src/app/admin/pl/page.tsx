"use client";
/*
 * Admin manager for professional learning sessions — posted here, browsed and
 * booked by teachers under /teacher/pl.
 */
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { SectionHeader, Button, Modal, FormField, inputClass, Badge, EmptyState } from "@/components/ui/primitives";
import {
  getPLSessions, upsertPLSession, deletePLSession, uploadPLImage, getAllPLBookings,
} from "@/lib/supabaseService";
import {
  GraduationCap, Plus, Pencil, Trash2, Loader, Eye, EyeOff, Upload,
  Calendar, MapPin, Ticket, Monitor, UsersRound, Blend, Copy, Check as CheckIcon,
} from "lucide-react";
import type { PLSession, PLMode, PLBooking } from "@/types";

const MODE_META: Record<PLMode, { label: string; Icon: typeof Monitor; chip: string }> = {
  "in-person": { label: "In person", Icon: UsersRound, chip: "bg-forest-100 text-forest-700" },
  online:      { label: "Online",    Icon: Monitor,    chip: "bg-mist-100 text-mist-600" },
  hybrid:      { label: "Hybrid",    Icon: Blend,      chip: "bg-gold-300/40 text-clay-600" },
};

const emptySession = (): PLSession => ({
  id: `pl-${Date.now().toString(36)}`,
  title: "",
  description: "",
  sessionDate: "",
  timeLabel: "",
  cost: "",
  mode: "in-person",
  location: "",
  linkUrl: "",
  imageUrl: "",
  published: true,
});

function formatPLDate(iso: string): string {
  if (!iso) return "Date to be announced";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminPLPage() {
  const [sessions, setSessions] = useState<PLSession[]>([]);
  const [bookings, setBookings] = useState<PLBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PLSession | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [attendeesFor, setAttendeesFor] = useState<PLSession | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([getPLSessions(), getAllPLBookings()]).then(([s, b]) => {
      setSessions(s);
      setBookings(b);
      setLoading(false);
    });
  }, []);

  const bookingsFor = (sessionId: string) => bookings.filter((b) => b.sessionId === sessionId);

  const copyEmails = async (list: PLBooking[]) => {
    await navigator.clipboard.writeText(list.map((b) => b.email).filter(Boolean).join(", "));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaved = (saved: PLSession) => {
    setSessions((prev) => {
      const exists = prev.some((s) => s.id === saved.id);
      const next = exists ? prev.map((s) => (s.id === saved.id ? saved : s)) : [...prev, saved];
      return [...next].sort((a, b) => (a.sessionDate || "9999").localeCompare(b.sessionDate || "9999"));
    });
    setEditing(null);
  };

  const handlePublish = async (s: PLSession) => {
    const updated = { ...s, published: !s.published };
    setSessions((prev) => prev.map((x) => (x.id === s.id ? updated : x)));
    await upsertPLSession(updated);
  };

  const handleDelete = async (s: PLSession) => {
    if (!confirm(`Delete "${s.title}"? Teachers will no longer see this session.`)) return;
    await deletePLSession(s.id);
    setSessions((prev) => prev.filter((x) => x.id !== s.id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader className="h-8 w-8 animate-spin text-forest-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <SectionHeader
          title="Professional learning"
          subtitle="Post PL sessions for teachers — they browse and register from their portal"
        />
        <Button onClick={() => { setEditing(emptySession()); setIsNew(true); }}>
          <Plus className="h-4 w-4" aria-hidden /> New session
        </Button>
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          Icon={GraduationCap}
          title="No sessions yet"
          message="Post your first professional learning session for teachers."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sessions.map((s) => {
            const meta = MODE_META[s.mode];
            return (
              <div key={s.id} className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-black/5">
                {/* Banner */}
                <div className={`relative h-32 ${s.published ? "" : "opacity-45"}`}>
                  {s.imageUrl ? (
                    <Image src={s.imageUrl} alt="" fill className="object-cover" sizes="400px" />
                  ) : (
                    <div
                      className="absolute inset-0"
                      style={{ background: "linear-gradient(120deg, #204535, #3d7a5e)" }}
                    >
                      <GraduationCap className="absolute -bottom-3 right-4 h-16 w-16 text-white/10" aria-hidden />
                    </div>
                  )}
                  <span className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${meta.chip}`}>
                    <meta.Icon className="h-3 w-3" aria-hidden /> {meta.label}
                  </span>
                  {!s.published && (
                    <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-charcoal-soft">
                      Hidden
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <h3 className="display line-clamp-2 text-base font-bold leading-snug text-forest-900">
                    {s.title || "Untitled session"}
                  </h3>
                  <div className="space-y-1 text-xs text-charcoal-soft">
                    <p className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      {formatPLDate(s.sessionDate)}{s.timeLabel ? ` · ${s.timeLabel}` : ""}
                    </p>
                    {s.location && (
                      <p className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden /> {s.location}
                      </p>
                    )}
                    <p className="flex items-center gap-1.5">
                      <Ticket className="h-3.5 w-3.5 shrink-0" aria-hidden /> {s.cost || "Free"}
                    </p>
                  </div>

                  <div className="mt-auto flex items-center gap-0.5 pt-2">
                    <button
                      onClick={() => setAttendeesFor(s)}
                      title="View bookings"
                      className={`mr-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition-colors ${
                        bookingsFor(s.id).length > 0
                          ? "bg-forest-100 text-forest-700 hover:bg-forest-50"
                          : "bg-cream text-charcoal-soft/60 ring-1 ring-sand hover:text-charcoal"
                      }`}
                    >
                      <UsersRound className="h-3.5 w-3.5" aria-hidden />
                      {bookingsFor(s.id).length} booked
                    </button>
                    <button
                      onClick={() => handlePublish(s)}
                      title={s.published ? "Hide from teachers" : "Show to teachers"}
                      className="rounded-lg p-1.5 text-charcoal-soft transition-colors hover:bg-forest-50 hover:text-forest-700"
                    >
                      {s.published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    <div className="flex-1" />
                    <button
                      onClick={() => { setEditing(s); setIsNew(false); }}
                      className="rounded-lg p-1.5 text-charcoal-soft transition-colors hover:bg-forest-50 hover:text-forest-700"
                      aria-label="Edit session"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(s)}
                      className="rounded-lg p-1.5 text-clay-400 transition-colors hover:bg-clay-400/10 hover:text-clay-600"
                      aria-label="Delete session"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <SessionForm
          session={editing}
          isNew={isNew}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Attendees modal */}
      <Modal
        open={!!attendeesFor}
        onClose={() => setAttendeesFor(null)}
        title={attendeesFor ? `Bookings — ${attendeesFor.title}` : ""}
        maxWidth="max-w-lg"
      >
        {attendeesFor && (() => {
          const list = bookingsFor(attendeesFor.id);
          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-charcoal-soft">
                  {list.length} teacher{list.length !== 1 ? "s" : ""} booked
                </p>
                {list.length > 0 && (
                  <button
                    onClick={() => copyEmails(list)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-sand-dark bg-white px-3 py-1.5 text-xs font-bold text-charcoal transition-colors hover:bg-cream"
                  >
                    {copied ? <CheckIcon className="h-3.5 w-3.5 text-forest-600" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copied!" : "Copy emails"}
                  </button>
                )}
              </div>

              {list.length === 0 ? (
                <p className="rounded-2xl bg-cream/60 px-4 py-6 text-center text-sm text-charcoal-soft">
                  No bookings yet.
                </p>
              ) : (
                <div className="max-h-[50vh] space-y-2 overflow-y-auto">
                  {list.map((b) => (
                    <div key={b.id} className="flex items-center gap-3 rounded-2xl bg-cream/60 px-4 py-3 ring-1 ring-sand">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-forest-900">{b.name || "—"}</p>
                        <p className="truncate text-xs text-charcoal-soft">{b.email || "—"}</p>
                      </div>
                      <span className="shrink-0 text-xs text-charcoal-soft">
                        {b.bookedAt ? new Date(b.bookedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" }) : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}

function SessionForm({
  session,
  isNew,
  onClose,
  onSaved,
}: {
  session: PLSession;
  isNew: boolean;
  onClose: () => void;
  onSaved: (s: PLSession) => void;
}) {
  const [draft, setDraft] = useState<PLSession>(session);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const patch = (p: Partial<PLSession>) => setDraft((d) => ({ ...d, ...p }));

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const url = await uploadPLImage(file);
      patch({ imageUrl: url });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.title.trim()) {
      setError("Please give the session a title.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const clean = { ...draft, title: draft.title.trim() };
      await upsertPLSession(clean);
      onSaved(clean);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={isNew ? "New PL session" : `Edit ${session.title}`} maxWidth="max-w-2xl">
      <form onSubmit={submit} className="space-y-4">
        <FormField label="Title" required>
          <input
            className={inputClass}
            value={draft.title}
            onChange={(e) => patch({ title: e.target.value })}
            placeholder="e.g. Adaptive teaching with Edventra"
            autoFocus={isNew}
          />
        </FormField>

        <FormField label="Description">
          <textarea
            className={`${inputClass} resize-none`}
            rows={3}
            value={draft.description}
            onChange={(e) => patch({ description: e.target.value })}
            placeholder="What will teachers get out of this session?"
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Date">
            <input
              type="date"
              className={inputClass}
              value={draft.sessionDate}
              onChange={(e) => patch({ sessionDate: e.target.value })}
            />
          </FormField>
          <FormField label="Time">
            <input
              className={inputClass}
              value={draft.timeLabel}
              onChange={(e) => patch({ timeLabel: e.target.value })}
              placeholder="e.g. 4:00–5:30pm AEST"
            />
          </FormField>
        </div>

        {/* Mode */}
        <div>
          <p className="mb-1.5 text-sm font-semibold text-forest-900">Mode</p>
          <div className="flex gap-2">
            {(Object.keys(MODE_META) as PLMode[]).map((m) => {
              const meta = MODE_META[m];
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => patch({ mode: m })}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-2xl border-2 px-3 py-2.5 text-sm font-semibold transition-all ${
                    draft.mode === m
                      ? "border-forest-600 bg-forest-50 text-forest-900"
                      : "border-sand text-charcoal-soft hover:border-forest-400"
                  }`}
                >
                  <meta.Icon className="h-4 w-4" aria-hidden /> {meta.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Location / platform">
            <input
              className={inputClass}
              value={draft.location}
              onChange={(e) => patch({ location: e.target.value })}
              placeholder="e.g. Taronga Zoo Institute, or Zoom"
            />
          </FormField>
          <FormField label="Cost">
            <input
              className={inputClass}
              value={draft.cost}
              onChange={(e) => patch({ cost: e.target.value })}
              placeholder='e.g. Free, or "$45 per teacher"'
            />
          </FormField>
        </div>

        <FormField label="Registration link">
          <input
            className={inputClass}
            value={draft.linkUrl}
            onChange={(e) => patch({ linkUrl: e.target.value })}
            placeholder="https://…"
          />
        </FormField>

        {/* Image */}
        <div>
          <p className="mb-1.5 text-sm font-semibold text-forest-900">Image</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
            }}
          />
          <div className="flex items-center gap-3">
            {draft.imageUrl && (
              <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-xl ring-1 ring-sand">
                <Image src={draft.imageUrl} alt="" fill className="object-cover" sizes="112px" />
              </div>
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-sand-dark bg-cream/50 px-4 py-3 text-sm font-semibold text-charcoal-soft transition-colors hover:border-forest-400 hover:text-forest-700 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" /> Uploading…
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" /> {draft.imageUrl ? "Replace image" : "Upload image"}
                </>
              )}
            </button>
            {draft.imageUrl && (
              <button
                type="button"
                onClick={() => patch({ imageUrl: "" })}
                className="rounded-2xl p-3 text-clay-400 ring-1 ring-sand transition-colors hover:bg-clay-400/10 hover:text-clay-600"
                aria-label="Remove image"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-cream/60 px-4 py-3">
          <input
            type="checkbox"
            checked={draft.published}
            onChange={(e) => patch({ published: e.target.checked })}
          />
          <span className="text-sm font-semibold text-forest-900">Visible to teachers</span>
        </label>

        {error && (
          <p className="rounded-2xl bg-clay-400/10 px-4 py-3 text-sm font-medium text-clay-600">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-sand-dark bg-white px-4 py-2.5 text-sm font-semibold text-charcoal hover:bg-cream transition-colors"
          >
            Cancel
          </button>
          <Button type="submit" disabled={saving} className="flex-1">
            {saving ? "Saving…" : isNew ? "Post session" : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

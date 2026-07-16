"use client";
/*
 * Teacher-facing professional learning: browse upcoming sessions posted by
 * admin and book a spot in-app (name + email recorded for the organiser).
 */
import { useEffect, useState } from "react";
import Image from "next/image";
import { useApp } from "@/lib/store";
import { SectionHeader, EmptyState, Modal, Button, FormField, inputClass } from "@/components/ui/primitives";
import {
  getPLSessions, getMyPLBookings, bookPLSession, cancelPLBooking,
} from "@/lib/supabaseService";
import { DEMO_TEACHER_ID } from "@/data/people";
import {
  GraduationCap, Calendar, MapPin, Ticket, Monitor, UsersRound, Blend,
  ArrowRight, Loader, Check, ExternalLink,
} from "lucide-react";
import type { PLSession, PLMode } from "@/types";

const MODE_META: Record<PLMode, { label: string; Icon: typeof Monitor; chip: string }> = {
  "in-person": { label: "In person", Icon: UsersRound, chip: "bg-forest-100 text-forest-700" },
  online:      { label: "Online",    Icon: Monitor,    chip: "bg-mist-100 text-mist-600" },
  hybrid:      { label: "Hybrid",    Icon: Blend,      chip: "bg-gold-300/40 text-clay-600" },
};

function formatPLDate(iso: string): string {
  if (!iso) return "Date to be announced";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function TeacherPLPage() {
  const { currentUser } = useApp();
  const teacherId = currentUser?.id ?? DEMO_TEACHER_ID;

  const [sessions, setSessions] = useState<PLSession[]>([]);
  const [bookedIds, setBookedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Booking modal
  const [booking, setBooking] = useState<PLSession | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getPLSessions(), getMyPLBookings(teacherId)]).then(([all, mine]) => {
      const today = new Date().toISOString().slice(0, 10);
      setSessions(
        all.filter((s) => s.published && (!s.sessionDate || s.sessionDate >= today))
      );
      setBookedIds(new Set(mine));
      setLoading(false);
    });
  }, [teacherId]);

  const openBooking = (s: PLSession) => {
    setBooking(s);
    setName(currentUser?.name ?? "");
    setEmail(currentUser?.email ?? "");
    setError("");
  };

  const submitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking || !name.trim() || !email.trim()) return;
    setSaving(true);
    setError("");
    try {
      await bookPLSession({
        sessionId: booking.id,
        teacherId,
        name: name.trim(),
        email: email.trim(),
      });
      setBookedIds((prev) => new Set([...prev, booking.id]));
      setBooking(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed — try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (s: PLSession) => {
    if (!confirm(`Cancel your booking for "${s.title}"?`)) return;
    await cancelPLBooking(s.id, teacherId);
    setBookedIds((prev) => {
      const next = new Set(prev);
      next.delete(s.id);
      return next;
    });
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
      <SectionHeader
        title="Professional learning"
        subtitle="Grow your practice with Edventra professional learning — book your spot below"
      />

      {sessions.length === 0 ? (
        <EmptyState
          Icon={GraduationCap}
          title="No upcoming sessions"
          message="New professional learning sessions will appear here — check back soon."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sessions.map((s) => {
            const meta = MODE_META[s.mode];
            const booked = bookedIds.has(s.id);
            return (
              <div key={s.id} className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-black/5 transition-all hover:shadow-lift">
                {/* Banner */}
                <div className="relative h-36">
                  {s.imageUrl ? (
                    <Image src={s.imageUrl} alt="" fill className="object-cover" sizes="400px" />
                  ) : (
                    <div
                      className="absolute inset-0"
                      style={{ background: "linear-gradient(120deg, #204535, #3d7a5e)" }}
                    >
                      <GraduationCap className="absolute -bottom-4 right-4 h-20 w-20 text-white/10" aria-hidden />
                    </div>
                  )}
                  <span className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${meta.chip}`}>
                    <meta.Icon className="h-3 w-3" aria-hidden /> {meta.label}
                  </span>
                  {booked && (
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-forest-700">
                      <Check className="h-3 w-3" aria-hidden /> Booked
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="flex flex-1 flex-col gap-2.5 p-5">
                  <h3 className="display text-lg font-bold leading-snug text-forest-900">{s.title}</h3>
                  {s.description && (
                    <p className="line-clamp-3 text-sm text-charcoal-soft">{s.description}</p>
                  )}

                  <div className="mt-auto space-y-1.5 pt-2 text-sm text-charcoal">
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 shrink-0 text-forest-600" aria-hidden />
                      {formatPLDate(s.sessionDate)}
                      {s.timeLabel ? ` · ${s.timeLabel}` : ""}
                    </p>
                    {s.location && (
                      <p className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 shrink-0 text-forest-600" aria-hidden /> {s.location}
                      </p>
                    )}
                    <p className="flex items-center gap-2">
                      <Ticket className="h-4 w-4 shrink-0 text-forest-600" aria-hidden />
                      <span className="font-semibold">{s.cost || "Free"}</span>
                    </p>
                  </div>

                  {booked ? (
                    <div className="mt-3 space-y-1.5">
                      <span className="flex w-full items-center justify-center gap-2 rounded-full bg-forest-50 py-2.5 text-sm font-bold text-forest-700 ring-1 ring-forest-400/40">
                        <Check className="h-4 w-4" aria-hidden /> You&apos;re booked in
                      </span>
                      <button
                        onClick={() => handleCancel(s)}
                        className="w-full text-center text-xs font-semibold text-charcoal-soft hover:text-clay-600 hover:underline"
                      >
                        Cancel booking
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => openBooking(s)}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-forest-700 py-2.5 text-sm font-bold text-white transition-colors hover:bg-forest-800"
                    >
                      Book a spot <ArrowRight className="h-4 w-4" aria-hidden />
                    </button>
                  )}

                  {s.linkUrl && (
                    <a
                      href={s.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 text-xs font-semibold text-forest-700 hover:underline"
                    >
                      More info <ExternalLink className="h-3 w-3" aria-hidden />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Booking modal */}
      <Modal
        open={!!booking}
        onClose={() => setBooking(null)}
        title="Book your spot"
        maxWidth="max-w-md"
      >
        {booking && (
          <form onSubmit={submitBooking} className="space-y-4">
            <div className="rounded-2xl bg-forest-50 px-4 py-3">
              <p className="text-sm font-bold text-forest-900">{booking.title}</p>
              <p className="mt-0.5 text-xs text-charcoal-soft">
                {formatPLDate(booking.sessionDate)}
                {booking.timeLabel ? ` · ${booking.timeLabel}` : ""}
                {booking.location ? ` · ${booking.location}` : ""}
                {booking.cost ? ` · ${booking.cost}` : ""}
              </p>
            </div>

            <FormField label="Your name" required>
              <input
                className={inputClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </FormField>

            <FormField label="Contact email" required>
              <input
                type="email"
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </FormField>

            <p className="text-xs text-charcoal-soft">
              Your name and email are shared with the Edventra team to organise the session.
            </p>

            {error && (
              <p className="rounded-2xl bg-clay-400/10 px-4 py-3 text-sm font-medium text-clay-600">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={saving}>
              {saving ? "Booking…" : "Confirm booking"}
            </Button>
          </form>
        )}
      </Modal>
    </div>
  );
}

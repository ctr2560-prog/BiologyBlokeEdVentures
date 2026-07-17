"use client";
import { FullPageLoader } from "@/components/ui/BrandLoader";
import { useEffect, useState } from "react";
import { SectionHeader, Button, Modal, Badge, EmptyState } from "@/components/ui/primitives";
import { QuizForm } from "@/components/forms/ContentForms";
import { getQuizzes, deleteQuiz } from "@/lib/supabaseService";
import { HelpCircle, Pencil, Plus, Trash2 } from "lucide-react";
import type { Quiz } from "@/types";

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading]  = useState(true);
  const [modal, setModal]      = useState(false);
  const [editing, setEditing]  = useState<Quiz | null>(null);

  useEffect(() => {
    getQuizzes().then((q) => { setQuizzes(q); setLoading(false); });
  }, []);

  const handleDelete = async (z: Quiz, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete quiz "${z.title}"? This cannot be undone.`)) return;
    try {
      await deleteQuiz(z.id);
      setQuizzes((prev) => prev.filter((q) => q.id !== z.id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Delete failed.");
    }
  };

  const closeModal = () => {
    setModal(false);
    setEditing(null);
  };

  if (loading) {
    return <FullPageLoader />;
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Quizzes"
        subtitle="Quick-check question sets — add them to lessons in the lesson builder"
        action={
          <Button onClick={() => { setEditing(null); setModal(true); }}>
            <Plus className="h-4 w-4" aria-hidden /> Build quiz
          </Button>
        }
      />

      {quizzes.length === 0 ? (
        <EmptyState
          Icon={HelpCircle}
          title="No quizzes yet"
          message="Build your first quiz to add checkpoints to lessons."
          action={
            <Button onClick={() => { setEditing(null); setModal(true); }}>
              <Plus className="h-4 w-4" aria-hidden /> Build quiz
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {quizzes.map((z) => (
            <button
              key={z.id}
              onClick={() => { setEditing(z); setModal(true); }}
              className="card-lift rounded-3xl bg-white p-5 text-left shadow-soft ring-1 ring-black/5"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="display font-bold text-forest-900 truncate">{z.title}</h3>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Badge tone="forest">{z.questions.length} question{z.questions.length !== 1 ? "s" : ""}</Badge>
                  <span
                    className="rounded-xl p-1.5 text-forest-600"
                    aria-hidden
                  >
                    <Pencil className="h-4 w-4" />
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => handleDelete(z, e)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleDelete(z, e as unknown as React.MouseEvent); }}
                    className="rounded-xl p-1.5 text-charcoal-soft hover:bg-clay-400/10 hover:text-clay-600 transition-colors"
                    aria-label="Delete quiz"
                  >
                    <Trash2 className="h-4 w-4" />
                  </span>
                </div>
              </div>
              {z.questions.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {z.questions.slice(0, 3).map((q, i) => (
                    <li key={q.id} className="rounded-2xl bg-cream/60 px-3 py-2 text-sm">
                      <span className="font-semibold text-forest-900">{i + 1}. {q.questionText}</span>
                      <div className="mt-1 flex gap-2">
                        <Badge tone="sand">{q.type}</Badge>
                        {q.linkedConcept && <Badge tone="mist">{q.linkedConcept}</Badge>}
                      </div>
                    </li>
                  ))}
                  {z.questions.length > 3 && (
                    <li className="px-3 text-xs text-charcoal-soft">
                      +{z.questions.length - 3} more
                    </li>
                  )}
                </ul>
              )}
            </button>
          ))}
        </div>
      )}

      <Modal
        open={modal}
        onClose={closeModal}
        title={editing ? `Edit quiz — ${editing.title}` : "Build quiz"}
        maxWidth="max-w-2xl"
      >
        {/* key forces a fresh form per quiz so state never bleeds between edits */}
        <QuizForm
          key={editing?.id ?? "new"}
          quiz={editing ?? undefined}
          onSaved={() => {
            closeModal();
            getQuizzes().then(setQuizzes);
          }}
        />
      </Modal>
    </div>
  );
}

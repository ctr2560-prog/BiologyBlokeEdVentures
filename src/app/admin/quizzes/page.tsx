"use client";
import { useEffect, useState } from "react";
import { SectionHeader, Button, Modal, Badge, EmptyState } from "@/components/ui/primitives";
import { QuizForm } from "@/components/forms/ContentForms";
import { getQuizzes } from "@/lib/supabaseService";
import { HelpCircle, Loader, Plus } from "lucide-react";
import type { Quiz } from "@/types";

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading]  = useState(true);
  const [modal, setModal]      = useState(false);

  useEffect(() => {
    getQuizzes().then((q) => { setQuizzes(q); setLoading(false); });
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
        title="Quizzes"
        subtitle="Quick-check question sets linked to lessons, used for adaptive recommendations"
        action={
          <Button onClick={() => setModal(true)}>
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
            <Button onClick={() => setModal(true)}>
              <Plus className="h-4 w-4" aria-hidden /> Build quiz
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {quizzes.map((z) => (
            <div key={z.id} className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-black/5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="display font-bold text-forest-900 truncate">{z.title}</h3>
                </div>
                <Badge tone="forest">{z.questions.length} question{z.questions.length !== 1 ? "s" : ""}</Badge>
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
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Build quiz" maxWidth="max-w-2xl">
        <QuizForm
          onSaved={() => {
            setModal(false);
            getQuizzes().then(setQuizzes);
          }}
        />
      </Modal>
    </div>
  );
}

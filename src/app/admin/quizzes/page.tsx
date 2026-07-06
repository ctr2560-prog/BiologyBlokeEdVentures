"use client";
import { useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { SectionHeader, Button, Modal, Badge } from "@/components/ui/primitives";
import { QuizForm } from "@/components/forms/ContentForms";
import { getQuizzes, getTopic } from "@/lib/dataService";

export default function QuizzesPage() {
  const { version, bump } = useApp();
  const [modal, setModal] = useState(false);
  const quizzes = useMemo(() => {
    void version;
    return getQuizzes();
  }, [version]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Quizzes"
        subtitle="Quick checks linked to topics, used for adaptive recommendations"
        action={<Button onClick={() => setModal(true)}> Build quiz</Button>}
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {quizzes.map((z) => (
          <div key={z.id} className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-black/5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="display font-bold text-forest-900">{z.title}</h3>
                <p className="text-xs text-charcoal-soft">{getTopic(z.topicId)?.title ?? "-"}</p>
              </div>
              <Badge tone="forest">{z.questions.length} questions</Badge>
            </div>
            <ul className="mt-3 space-y-2">
              {z.questions.map((q, i) => (
                <li key={q.id} className="rounded-2xl bg-cream/60 px-3 py-2 text-sm">
                  <span className="font-semibold text-forest-900">{i + 1}. {q.questionText}</span>
                  <div className="mt-1 flex gap-2">
                    <Badge tone="sand">{q.type}</Badge>
                    <Badge tone="mist">{q.linkedConcept}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <Modal open={modal} onClose={() => setModal(false)} title="Quiz builder" maxWidth="max-w-2xl">
        <QuizForm
          onSaved={() => {
            bump();
            setModal(false);
          }}
        />
      </Modal>
    </div>
  );
}

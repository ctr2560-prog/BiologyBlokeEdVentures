import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

/*
 * Server-side quiz grading. Accepts the student's answers and returns
 * the score + per-question feedback, then persists to quiz_results.
 *
 * correct_answer is never sent to the browser — it is fetched and compared
 * entirely within this route using the service role client.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { quizId, answers, studentId, classId, lessonId } = body as {
    quizId: string;
    answers: Record<string, string>;
    studentId: string;
    classId: string;
    lessonId?: string;
  };

  if (!quizId || !answers || !studentId || !classId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = await createSupabaseServiceClient();

  // Fetch the quiz with correct answers (service role — never reaches the browser)
  const { data: questions, error } = await supabase
    .from("questions")
    .select("id, type, correct_answer")
    .eq("quiz_id", quizId);

  if (error || !questions) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  // Grade: only multipleChoice and trueFalse count; shortResponse is always marked correct
  type ResultDetail = { correct: boolean; correctAnswer: string };
  const results: Record<string, ResultDetail> = {};
  let gradedCount = 0;
  let correctCount = 0;

  for (const q of questions) {
    if (q.type === "shortResponse") {
      results[q.id] = { correct: true, correctAnswer: "" };
    } else {
      gradedCount++;
      const isCorrect = String(answers[q.id] ?? "").trim() === String(q.correct_answer ?? "").trim();
      if (isCorrect) correctCount++;
      results[q.id] = { correct: isCorrect, correctAnswer: q.correct_answer ?? "" };
    }
  }

  const score = gradedCount === 0 ? 100 : Math.round((correctCount / gradedCount) * 100);

  // Persist — upsert so retakes increment attempts rather than duplicate
  const { data: existing } = await supabase
    .from("quiz_results")
    .select("id, attempts")
    .eq("quiz_id", quizId)
    .eq("student_id", studentId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("quiz_results")
      .update({
        score,
        attempts: (existing.attempts ?? 1) + 1,
        submitted_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    const id = `qr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    await supabase.from("quiz_results").insert({
      id,
      quiz_id: quizId,
      student_id: studentId,
      class_id: classId,
      lesson_id: lessonId ?? null,
      score,
      attempts: 1,
    });
  }

  return NextResponse.json({ score, results });
}

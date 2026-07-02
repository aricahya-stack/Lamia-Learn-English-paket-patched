import { AttemptStatus, QuestionType, type Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SubmitPayload = {
  quizId?: string;
  answers?: Record<string, string>;
};

const speakingTypes = new Set<string>([
  QuestionType.PRONUNCIATION_CHECK,
  QuestionType.LISTEN_AND_REPEAT,
  QuestionType.READ_ALOUD,
  QuestionType.SPEAKING_PROMPT
]);

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/[.!?]/g, "").replace(/\s+/g, " ");
}

function scoreSpeaking(target: string, recognized: string) {
  const targetWords = normalize(target).split(" ").filter(Boolean);
  const recognizedWords = normalize(recognized).split(" ").filter(Boolean);
  if (!targetWords.length) return 0;
  const correct = targetWords.filter((word, index) => recognizedWords[index] === word || recognizedWords.includes(word)).length;
  return Math.round((correct / targetWords.length) * 100);
}

function scoreMatching(question: { matchingPairs?: { leftItem: string; rightItem: string }[] }, rawAnswer: string) {
  const pairs = question.matchingPairs ?? [];
  if (!pairs.length) return { correct: 0, total: 0, isCorrect: false };

  let parsed: Record<string, string> = {};
  try {
    parsed = JSON.parse(rawAnswer || "{}");
  } catch {
    parsed = {};
  }

  const correct = pairs.filter((pair) => parsed[pair.leftItem] === pair.rightItem).length;
  return { correct, total: pairs.length, isCorrect: correct === pairs.length };
}

export async function POST(request: Request) {
  const user = await requireRole(["STUDENT", "SUPER_ADMIN"]);
  const payload = (await request.json()) as SubmitPayload;

  if (!payload.quizId || !payload.answers) {
    return NextResponse.json({ ok: false, message: "quizId dan answers wajib dikirim." }, { status: 400 });
  }

  const quiz = await prisma.quiz.findUnique({
    where: { id: payload.quizId },
    include: { questions: { include: { options: true, matchingPairs: true } } }
  });

  if (!quiz) {
    return NextResponse.json({ ok: false, message: "Kuis tidak ditemukan." }, { status: 404 });
  }

  let totalScore = 0;
  let maxScore = 0;

  const answerRows: Prisma.StudentAnswerCreateWithoutAttemptInput[] = quiz.questions.map((question: any) => {
    const answer = payload.answers?.[question.id] ?? "";
    maxScore += question.score;

    let isCorrect = false;
    let scoreObtained = 0;
    let pronunciationScore: number | undefined;

    if (speakingTypes.has(question.type)) {
      const target = question.targetText || question.correctAnswer || question.questionText || "";
      pronunciationScore = scoreSpeaking(target, answer);
      const minScore = question.minPronunciationScore ?? 70;
      isCorrect = pronunciationScore >= minScore;
      scoreObtained = isCorrect ? question.score : Math.round((pronunciationScore / 100) * question.score);
    } else if (question.type === QuestionType.MATCHING) {
      const matchingScore = scoreMatching(question, answer);
      isCorrect = matchingScore.isCorrect;
      scoreObtained = matchingScore.total ? Math.round((matchingScore.correct / matchingScore.total) * question.score) : 0;
    } else {
      isCorrect = Boolean(question.correctAnswer && normalize(answer) === normalize(question.correctAnswer));
      scoreObtained = isCorrect ? question.score : 0;
    }

    totalScore += scoreObtained;

    return {
      question: { connect: { id: question.id } },
      answerText: answer,
      answerJson: { value: answer },
      recognizedText: speakingTypes.has(question.type) ? answer : undefined,
      pronunciationScore,
      isCorrect,
      scoreObtained
    };
  });

  const submittedAt = new Date();

  const attempt = await prisma.studentAttempt.create({
    data: {
      student: { connect: { id: user.id } },
      quiz: { connect: { id: quiz.id } },
      status: AttemptStatus.SUBMITTED,
      totalScore,
      maxScore,
      submittedAt,
      answers: { create: answerRows }
    }
  });

  const attemptNumber = await prisma.studentAttempt.count({ where: { studentId: user.id, quizId: quiz.id, status: AttemptStatus.SUBMITTED } });

  return NextResponse.json({
    ok: true,
    attemptId: attempt.id,
    totalScore,
    maxScore,
    submittedAt: attempt.submittedAt?.toISOString() ?? submittedAt.toISOString(),
    attemptNumber
  });
}

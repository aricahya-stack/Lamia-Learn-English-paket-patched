"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Headphones, Loader2, RotateCcw, Volume2 } from "lucide-react";
import { MatchingQuestion, scoreMatchingAnswer } from "@/components/matching-question";
import { SpeakingQuiz } from "@/components/speaking-quiz";
import type { LatestAttemptView, QuestionView } from "@/lib/materials";

type Props = {
  quizId: string;
  questions: QuestionView[];
  latestAttempt?: LatestAttemptView | null;
};

const SPEAKING_TYPES = ["PRONUNCIATION_CHECK", "LISTEN_AND_REPEAT", "READ_ALOUD", "SPEAKING_PROMPT"];

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/[.!?]/g, "").replace(/\s+/g, " ");
}

function BrowserAudioButton({ text }: { text: string }) {
  function play() {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  }
  return <button className="secondary-button" type="button" onClick={play}><Volume2 size={16} /> Putar Suara</button>;
}

function scoreSpeaking(target: string, recognized: string) {
  const targetWords = normalize(target).split(" ").filter(Boolean);
  const recognizedWords = normalize(recognized).split(" ").filter(Boolean);
  if (!targetWords.length) return 0;
  const correct = targetWords.filter((word, index) => recognizedWords[index] === word || recognizedWords.includes(word)).length;
  return Math.round((correct / targetWords.length) * 100);
}

function formatDate(value?: string | null) {
  if (!value) return "tanggal tidak tersedia";
  try {
    return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return "tanggal tidak tersedia";
  }
}

export function QuizRenderer({ quizId, questions, latestAttempt = null }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>(latestAttempt?.answers ?? {});
  const [submitted, setSubmitted] = useState(Boolean(latestAttempt));
  const [savedAttempt, setSavedAttempt] = useState<LatestAttemptView | null>(latestAttempt);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(latestAttempt ? "Jawaban terakhir sudah dimuat. Siswa tetap boleh mengerjakan ulang." : "");

  const score = useMemo(() => {
    return questions.reduce((sum, q) => {
      const answer = answers[q.id] ?? "";
      if (SPEAKING_TYPES.includes(q.type)) {
        const target = q.targetText || q.correctAnswer || q.text;
        const speakingScore = scoreSpeaking(target, answer);
        return sum + (speakingScore >= (q.minScore ?? 70) ? q.score : Math.round((speakingScore / 100) * q.score));
      }
      if (q.type === "MATCHING" && q.pairs?.length) {
        const matchingScore = scoreMatchingAnswer(q.pairs, answer);
        return sum + Math.round((matchingScore.correct / matchingScore.total) * q.score);
      }
      return sum + (q.correctAnswer && normalize(answer) === normalize(q.correctAnswer) ? q.score : 0);
    }, 0);
  }, [answers, questions]);

  const maxScore = questions.reduce((sum, q) => sum + q.score, 0);

  function updateAnswer(questionId: string, value: string) {
    setAnswers((current) => ({ ...current, [questionId]: value }));
  }

  function clearLoadedAnswers() {
    setAnswers({});
    setSubmitted(false);
    setSavedAttempt(null);
    setSaveMessage("Jawaban dikosongkan. Silakan mulai percobaan baru.");
  }

  async function submitQuiz() {
    setSubmitted(true);
    setSaving(true);
    setSaveMessage("");

    try {
      const response = await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId, answers })
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || "Gagal menyimpan nilai.");
      const nextAttempt: LatestAttemptView = {
        id: data.attemptId,
        totalScore: data.totalScore,
        maxScore: data.maxScore,
        submittedAt: data.submittedAt ?? new Date().toISOString(),
        attemptNumber: data.attemptNumber ?? ((savedAttempt?.attemptNumber ?? 0) + 1),
        answers,
        results: {}
      };
      setSavedAttempt(nextAttempt);
      setSaveMessage(`Percobaan baru tersimpan: ${data.totalScore}/${data.maxScore}. Siswa tetap dapat mengerjakan ulang.`);
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "Nilai belum tersimpan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="quiz-section">
      <div className="panel-heading">
        <div><p className="eyebrow">Kuis Interaktif</p><h3>Latihan Materi</h3></div>
        {submitted ? <span className="badge warning">Skor {score}/{maxScore}</span> : null}
      </div>

      {savedAttempt ? (
        <div className="attempt-resume card">
          <div>
            <strong>Sudah dikerjakan</strong>
            <p>Jawaban terakhir dari percobaan ke-{savedAttempt.attemptNumber} sudah dimuat. Nilai terakhir: {savedAttempt.totalScore}/{savedAttempt.maxScore} • {formatDate(savedAttempt.submittedAt)}.</p>
          </div>
          <button className="secondary-button" type="button" onClick={clearLoadedAnswers}><RotateCcw size={16} /> Kosongkan Jawaban</button>
        </div>
      ) : null}

      <div className="question-list">
        {questions.map((question, index) => {
          const isChoice = question.options?.length;
          const needAudio = ["LISTEN_AND_CHOOSE", "LISTEN_AND_TYPE", "AUDIO_MATCHING"].includes(question.type);
          const isSpeaking = SPEAKING_TYPES.includes(question.type);
          const answer = answers[question.id] ?? "";
          const speakingTarget = question.targetText || question.correctAnswer || question.text;
          const speakingScore = isSpeaking ? scoreSpeaking(speakingTarget, answer) : 0;
          const matchingScore = question.type === "MATCHING" ? scoreMatchingAnswer(question.pairs ?? [], answer) : null;
          const isCorrect = isSpeaking
            ? speakingScore >= (question.minScore ?? 70)
            : question.type === "MATCHING"
              ? Boolean(matchingScore?.isCorrect)
              : question.correctAnswer && normalize(answer) === normalize(question.correctAnswer);
          const hasLoadedAnswer = Boolean(savedAttempt?.answers?.[question.id]);

          return (
            <article className={`question-card ${hasLoadedAnswer ? "has-loaded-answer" : ""}`} key={question.id}>
              <div className="question-heading">
                <span className="question-number">{index + 1}</span>
                <div>
                  <span className="badge">{question.type.replaceAll("_", " ")}</span>
                  {hasLoadedAnswer ? <span className="loaded-answer-badge">Jawaban sebelumnya dimuat</span> : null}
                  <h3>{question.text}</h3>
                  {needAudio ? <BrowserAudioButton text={question.text.replace(/^.*:/, "")} /> : null}
                </div>
              </div>
              {isSpeaking ? (
                <SpeakingQuiz
                  questionId={question.id}
                  targetText={speakingTarget}
                  sampleText={question.sampleText}
                  minScore={question.minScore}
                  maxAttempts={question.maxAttempts}
                  initialValue={savedAttempt?.answers?.[question.id] ?? ""}
                  onAnswer={updateAnswer}
                />
              ) : question.type === "MATCHING" && question.pairs?.length ? (
                <MatchingQuestion
                  questionId={question.id}
                  pairs={question.pairs}
                  submitted={submitted}
                  initialValue={savedAttempt?.answers?.[question.id] ?? ""}
                  onAnswer={updateAnswer}
                />
              ) : isChoice ? (
                <div className="option-list">
                  {question.options!.map((option) => (
                    <label className={`option-item ${answer === option.text ? "is-selected" : ""}`} key={option.label}>
                      <input type="radio" name={question.id} value={option.text} checked={answer === option.text} onChange={(e) => updateAnswer(question.id, e.target.value)} />
                      <span className="option-label">{option.label}</span>
                      <span>{option.text}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <input className="text-input answer-input" placeholder="Tulis jawaban..." value={answer} onChange={(e) => updateAnswer(question.id, e.target.value)} />
              )}
              {submitted ? (
                <div className={`feedback ${isCorrect ? "correct" : "wrong"}`}>
                  <CheckCircle2 size={16} /> {isSpeaking
                    ? `Skor speaking: ${speakingScore}%. Target minimal: ${question.minScore ?? 70}%.`
                    : question.type === "MATCHING"
                      ? `Pasangan benar: ${matchingScore?.correct ?? 0}/${matchingScore?.total ?? 0}.`
                      : `Jawaban benar: ${question.correctAnswer ?? "lihat kunci guru"}`}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
      <div className="quiz-submit-row">
        <button className="primary-button" type="button" onClick={submitQuiz} disabled={saving || !questions.length}>{saving ? <Loader2 size={16} className="spin" /> : <Headphones size={16} />} {saving ? "Menyimpan..." : savedAttempt ? "Simpan Percobaan Baru" : "Selesai dan Simpan Nilai"}</button>
        {saveMessage ? <span className="save-message">{saveMessage}</span> : null}
      </div>
    </section>
  );
}

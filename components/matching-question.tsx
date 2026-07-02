"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";

type MatchingPair = { left: string; right: string };

type Props = {
  questionId: string;
  pairs: MatchingPair[];
  submitted?: boolean;
  onAnswer: (questionId: string, value: string) => void;
};

function shuffleStable(items: string[]) {
  const sorted = [...items].sort((a, b) => {
    const left = [...a].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const right = [...b].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return left - right || a.localeCompare(b);
  });

  if (sorted.length <= 1) return sorted;
  return [...sorted.slice(1), sorted[0]];
}

export function serializeMatchingAnswer(matches: Record<string, string>) {
  return JSON.stringify(matches);
}

export function scoreMatchingAnswer(pairs: MatchingPair[] = [], rawAnswer = "") {
  if (!pairs.length) return { correct: 0, total: 0, isCorrect: false };

  let parsed: Record<string, string> = {};
  try {
    parsed = JSON.parse(rawAnswer || "{}") as Record<string, string>;
  } catch {
    parsed = {};
  }

  const correct = pairs.filter((pair) => parsed[pair.left] === pair.right).length;
  return { correct, total: pairs.length, isCorrect: correct === pairs.length };
}

export function MatchingQuestion({ questionId, pairs, submitted = false, onAnswer }: Props) {
  const [selectedLeft, setSelectedLeft] = useState<string>("");
  const [matches, setMatches] = useState<Record<string, string>>({});

  const rightItems = useMemo(() => shuffleStable(pairs.map((pair) => pair.right)), [pairs]);
  const result = scoreMatchingAnswer(pairs, serializeMatchingAnswer(matches));

  function setMatch(left: string, right: string) {
    const next = { ...matches };

    Object.keys(next).forEach((key) => {
      if (next[key] === right) delete next[key];
    });

    next[left] = right;
    setMatches(next);
    setSelectedLeft("");
    onAnswer(questionId, serializeMatchingAnswer(next));
  }

  function reset() {
    setMatches({});
    setSelectedLeft("");
    onAnswer(questionId, serializeMatchingAnswer({}));
  }

  return (
    <div className="matching-interactive" aria-label="Latihan mencocokkan pasangan">
      <div className="matching-help">
        <span>Pilih kartu kiri, lalu pilih pasangan yang benar di kanan.</span>
        <button className="secondary-button" type="button" onClick={reset}>
          <RotateCcw size={16} /> Reset
        </button>
      </div>

      <div className="matching-board">
        <div className="matching-column">
          <span className="field-label">Kartu kiri</span>
          {pairs.map((pair) => {
            const matchedRight = matches[pair.left];
            const isSelected = selectedLeft === pair.left;
            const isRight = submitted && matchedRight === pair.right;
            const isWrong = submitted && matchedRight && matchedRight !== pair.right;

            return (
              <button
                key={pair.left}
                className={`matching-card ${isSelected ? "is-selected" : ""} ${matchedRight ? "is-matched" : ""} ${isRight ? "is-correct" : ""} ${isWrong ? "is-wrong" : ""}`}
                type="button"
                onClick={() => setSelectedLeft(pair.left)}
              >
                <strong>{pair.left}</strong>
                <small>{matchedRight ? `Dipilih: ${matchedRight}` : "Belum dipasangkan"}</small>
              </button>
            );
          })}
        </div>

        <div className="matching-column">
          <span className="field-label">Pilihan kanan</span>
          {rightItems.map((right) => {
            const usedBy = Object.entries(matches).find(([, value]) => value === right)?.[0];
            return (
              <button
                key={right}
                className={`matching-card right-card ${usedBy ? "is-matched" : ""}`}
                type="button"
                disabled={!selectedLeft}
                onClick={() => selectedLeft && setMatch(selectedLeft, right)}
              >
                <strong>{right}</strong>
                <small>{usedBy ? `Pasangan: ${usedBy}` : selectedLeft ? "Klik untuk memasangkan" : "Pilih kartu kiri dulu"}</small>
              </button>
            );
          })}
        </div>
      </div>

      <div className="matching-status">
        <CheckCircle2 size={16} /> Terpasang {Object.keys(matches).length}/{pairs.length}
        {submitted ? ` • Benar ${result.correct}/${result.total}` : ""}
      </div>
    </div>
  );
}

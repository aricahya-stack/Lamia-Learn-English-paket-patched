"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Mic, MicOff, RotateCcw, Volume2 } from "lucide-react";

type SpeechRecognitionConstructor = new () => SpeechRecognition;

type SpeechRecognition = EventTarget & {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionEvent = {
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      length: number;
      [index: number]: { transcript: string; confidence: number };
    };
  };
};

type SpeechRecognitionErrorEvent = {
  error: string;
  message?: string;
};

type BrowserWindowWithSpeech = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

type Props = {
  questionId: string;
  targetText: string;
  sampleText?: string;
  minScore?: number;
  maxAttempts?: number;
  initialValue?: string;
  onAnswer: (questionId: string, value: string) => void;
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string) {
  return normalizeText(value).split(" ").filter(Boolean);
}

function scorePronunciation(target: string, recognized: string) {
  const targetWords = tokenize(target);
  const recognizedWords = tokenize(recognized);
  if (!targetWords.length) return { score: 0, correctWords: [], wrongWords: [] };

  const correctWords: string[] = [];
  const wrongWords: string[] = [];
  targetWords.forEach((word, index) => {
    if (recognizedWords[index] === word || recognizedWords.includes(word)) correctWords.push(word);
    else wrongWords.push(word);
  });

  return {
    score: Math.round((correctWords.length / targetWords.length) * 100),
    correctWords,
    wrongWords
  };
}

function speak(text: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.82;
  window.speechSynthesis.speak(utterance);
}

function speechErrorMessage(error: string, fallback = "") {
  if (error === "not-allowed" || error === "service-not-allowed") {
    return "Mikrofon belum diizinkan. Klik ikon gembok/setting situs di browser, izinkan Microphone, lalu refresh halaman. Di HP, gunakan Chrome dan buka melalui localhost/HTTPS.";
  }
  if (error === "no-speech") return "Suara belum terbaca. Coba dekatkan mikrofon dan ucapkan lebih jelas.";
  if (error === "audio-capture") return "Mikrofon tidak terdeteksi. Pastikan mikrofon aktif dan tidak dipakai aplikasi lain.";
  if (error === "network") return "Layanan Speech Recognition membutuhkan koneksi internet stabil pada Chrome/Edge.";
  if (error === "aborted") return "Perekaman dibatalkan. Silakan coba lagi.";
  return fallback || `Speech recognition gagal: ${error}`;
}

async function requestMicrophoneAccess() {
  if (!navigator.mediaDevices?.getUserMedia) return;
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  stream.getTracks().forEach((track) => track.stop());
}

export function SpeakingQuiz({ questionId, targetText, sampleText, minScore = 70, maxAttempts = 3, initialValue = "", onAnswer }: Props) {
  const [recognizedText, setRecognizedText] = useState(initialValue);
  const [listening, setListening] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [error, setError] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    setRecognizedText(initialValue);
  }, [initialValue]);

  const result = useMemo(() => scorePronunciation(targetText, recognizedText), [targetText, recognizedText]);
  const passed = recognizedText ? result.score >= minScore : false;
  const canRetry = attemptCount < maxAttempts || maxAttempts <= 0;

  async function startRecognition() {
    setError("");

    const browserWindow = window as BrowserWindowWithSpeech;
    const Recognition = browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition;

    if (!Recognition) {
      setError("Browser belum mendukung Speech Recognition. Gunakan Chrome/Edge terbaru. Jika tetap gagal, isi jawaban manual di kotak cadangan.");
      return;
    }
    if (!window.isSecureContext && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") {
      setError("Speech Recognition perlu HTTPS atau localhost agar izin mikrofon dapat bekerja.");
      return;
    }
    if (!canRetry) {
      setError(`Batas percobaan sudah habis. Maksimal ${maxAttempts} kali.`);
      return;
    }

    try {
      await requestMicrophoneAccess();
    } catch (permissionError) {
      const name = permissionError instanceof DOMException ? permissionError.name : "not-allowed";
      setError(speechErrorMessage(name === "NotAllowedError" ? "not-allowed" : name, "Mikrofon belum dapat diakses."));
      return;
    }

    try {
      recognitionRef.current?.abort();
      const recognition = new Recognition();
      recognitionRef.current = recognition;
      recognition.lang = "en-US";
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript ?? "";
        setRecognizedText(transcript);
        onAnswer(questionId, transcript);
        setAttemptCount((count) => count + 1);
      };

      recognition.onerror = (event) => {
        setError(speechErrorMessage(event.error, event.message));
      };

      recognition.onend = () => setListening(false);
      setListening(true);
      recognition.start();
    } catch (startError) {
      setListening(false);
      const message = startError instanceof Error ? startError.message : "Speech recognition gagal dimulai.";
      setError(message);
    }
  }

  function reset() {
    recognitionRef.current?.abort();
    setRecognizedText("");
    setError("");
    onAnswer(questionId, "");
  }

  function updateManualAnswer(value: string) {
    setRecognizedText(value);
    setError("");
    onAnswer(questionId, value);
  }

  return (
    <div className="speaking-box">
      <div className="speaking-target">
        <span className="field-label">Teks yang harus dibaca siswa</span>
        <p>{targetText}</p>
      </div>
      <div className="reader-controls">
        <button className="secondary-button" type="button" onClick={() => speak(sampleText || targetText)}>
          <Volume2 size={16} /> Dengarkan Contoh
        </button>
        <button className="primary-button" type="button" disabled={listening || !canRetry} onClick={startRecognition}>
          {listening ? <MicOff size={16} /> : <Mic size={16} />} {listening ? "Mendengarkan..." : "Mulai Bicara"}
        </button>
        <button className="secondary-button" type="button" onClick={reset}>
          <RotateCcw size={16} /> Ulangi
        </button>
      </div>
      <p className="muted-text">Percobaan: {attemptCount}/{maxAttempts <= 0 ? "bebas" : maxAttempts} • Minimal skor: {minScore}</p>
      <label className="field-block manual-speaking-input">
        <span className="field-label">Cadangan jika mikrofon gagal</span>
        <input
          className="text-input"
          value={recognizedText}
          onChange={(event) => updateManualAnswer(event.target.value)}
          placeholder="Ketik hasil ucapan siswa di sini, misalnya: My name is Ana"
        />
      </label>
      {recognizedText ? (
        <div className={`speech-result ${passed ? "passed" : "retry"}`}>
          <strong>Hasil terbaca/diisi:</strong>
          <p>{recognizedText}</p>
          <span className="badge">Skor speaking {result.score}%</span>
          {result.wrongWords.length ? <p className="muted-text">Latih ulang kata: {result.wrongWords.join(", ")}</p> : <p className="muted-text">Pengucapan sudah terbaca sesuai target.</p>}
        </div>
      ) : null}
      {error ? <div className="feedback wrong">{error}</div> : null}
    </div>
  );
}

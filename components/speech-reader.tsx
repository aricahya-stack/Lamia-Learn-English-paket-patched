"use client";

import { useEffect, useMemo, useState } from "react";
import { Pause, Play, RotateCcw, Square, Volume2 } from "lucide-react";

function pickVoice(voices: SpeechSynthesisVoice[], lang: string, voiceType: string) {
  const femaleKeywords = ["female", "woman", "samantha", "jenny", "aria", "zira", "susan", "victoria"];
  const maleKeywords = ["male", "man", "guy", "david", "daniel", "mark", "alex", "george"];
  const keywords = voiceType === "male" ? maleKeywords : femaleKeywords;
  return (
    voices.find((voice) => voice.lang === lang && keywords.some((keyword) => voice.name.toLowerCase().includes(keyword))) ||
    voices.find((voice) => voice.lang === lang) ||
    voices.find((voice) => voice.lang.startsWith("en")) ||
    voices[0]
  );
}

export function SpeechReader({ text, defaultLang = "en-US" }: { text: string; defaultLang?: string }) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [lang, setLang] = useState(defaultLang);
  const [voiceType, setVoiceType] = useState("female");
  const [rate, setRate] = useState(0.85);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const availableLangs = useMemo(() => Array.from(new Set(voices.filter((v) => v.lang.startsWith("en")).map((v) => v.lang))).sort(), [voices]);

  function speak() {
    if (!("speechSynthesis" in window)) {
      alert("Browser ini belum mendukung fitur suara.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/<[^>]*>/g, " "));
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = voiceType === "female" ? 1.05 : 0.95;
    const voice = pickVoice(voices, lang, voiceType);
    if (voice) utterance.voice = voice;
    utterance.onend = () => setActive(false);
    utterance.onerror = () => setActive(false);
    setActive(true);
    window.speechSynthesis.speak(utterance);
  }

  function pause() {
    window.speechSynthesis.pause();
  }
  function resume() {
    window.speechSynthesis.resume();
  }
  function stop() {
    window.speechSynthesis.cancel();
    setActive(false);
  }

  return (
    <div className="reader-panel card">
      <div>
        <p className="eyebrow">Menu Baca</p>
        <h3>Browser Voice Reader</h3>
        <p className="muted-text">Suara mengikuti browser/perangkat. Jika pilihan laki-laki/perempuan tidak tersedia, sistem memakai suara English bawaan.</p>
      </div>
      <div className="reader-controls">
        <button className="primary-button" type="button" onClick={speak}><Volume2 size={16} /> Baca</button>
        <button className="secondary-button" type="button" onClick={pause}><Pause size={16} /> Pause</button>
        <button className="secondary-button" type="button" onClick={resume}><Play size={16} /> Lanjut</button>
        <button className="secondary-button" type="button" onClick={speak}><RotateCcw size={16} /> Ulangi</button>
        <button className="secondary-button" type="button" onClick={stop}><Square size={16} /> Stop</button>
      </div>
      <div className="reader-settings">
        <label>Suara
          <select className="select-input" value={voiceType} onChange={(e) => setVoiceType(e.target.value)}>
            <option value="female">Perempuan</option>
            <option value="male">Laki-laki</option>
            <option value="auto">Otomatis</option>
          </select>
        </label>
        <label>Bahasa/Aksen
          <select className="select-input" value={lang} onChange={(e) => setLang(e.target.value)}>
            {(availableLangs.length ? availableLangs : ["en-US", "en-GB", "en-AU"]).map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label>Kecepatan
          <select className="select-input" value={String(rate)} onChange={(e) => setRate(Number(e.target.value))}>
            <option value="0.7">Lambat</option>
            <option value="0.85">Normal anak</option>
            <option value="1">Normal</option>
            <option value="1.15">Cepat</option>
          </select>
        </label>
      </div>
      {active ? <span className="badge warning">Sedang dibacakan</span> : null}
    </div>
  );
}

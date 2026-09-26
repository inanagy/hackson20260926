"use client";

import { useEffect, useRef, useState } from "react";

const MAX_SECONDS = 15;

type Status = "idle" | "recording" | "transcribing" | "error";

export default function VoiceInput({ onTranscript }: { onTranscript: (text: string) => void }) {
  const [status, setStatus] = useState<Status>("idle");
  const [left, setLeft] = useState(MAX_SECONDS);
  const recorder = useRef<MediaRecorder | null>(null);
  const timers = useRef<number[]>([]);

  const supported =
    typeof window !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== "undefined";

  function clearTimers() {
    timers.current.forEach((t) => window.clearInterval(t));
    timers.current = [];
  }

  useEffect(
    () => () => {
      clearTimers();
      const r = recorder.current;
      if (r && r.state !== "inactive") {
        r.onstop = null;
        r.stop();
        r.stream.getTracks().forEach((t) => t.stop());
      }
    },
    [],
  );

  async function start() {
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setStatus("error");
      return;
    }

    const chunks: Blob[] = [];
    const r = new MediaRecorder(stream);
    r.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    r.onstop = async () => {
      clearTimers();
      stream.getTracks().forEach((t) => t.stop());
      setStatus("transcribing");
      const type = r.mimeType || "audio/webm";
      const form = new FormData();
      form.append("audio", new Blob(chunks, { type }), type.includes("mp4") ? "voice.mp4" : "voice.webm");
      try {
        const res = await fetch("/api/transcribe", { method: "POST", body: form });
        if (!res.ok) throw new Error(`transcribe ${res.status}`);
        const { transcript } = (await res.json()) as { transcript: string };
        if (transcript) onTranscript(transcript);
        setStatus("idle");
      } catch {
        setStatus("error");
      }
    };

    recorder.current = r;
    r.start();
    setLeft(MAX_SECONDS);
    setStatus("recording");
    const startedAt = Date.now();
    timers.current.push(
      window.setInterval(() => {
        const remaining = MAX_SECONDS - Math.floor((Date.now() - startedAt) / 1000);
        setLeft(Math.max(0, remaining));
        if (remaining <= 0 && r.state === "recording") r.stop();
      }, 250),
    );
  }

  function stop() {
    if (recorder.current?.state === "recording") recorder.current.stop();
  }

  if (!supported) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs">
      {status === "recording" ? (
        <button
          type="button"
          onClick={stop}
          className="flex items-center gap-2 rounded-full border border-accent bg-accent/15 px-4 py-2 text-accent"
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
          録音中 · 残り {left} 秒 · タップで終了
        </button>
      ) : (
        <button
          type="button"
          onClick={start}
          disabled={status === "transcribing"}
          className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-muted transition hover:border-muted hover:text-foreground disabled:opacity-50"
        >
          <MicIcon />
          {status === "transcribing" ? "文字にしています…" : "声で答える"}
        </button>
      )}
      {status === "error" && (
        <span className="text-muted">音声を文字にできませんでした。テキストで入力してください。</span>
      )}
      {status === "idle" && <span className="text-muted/70">最大{MAX_SECONDS}秒 · 音声は保存しません</span>}
    </div>
  );
}

function MicIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  );
}

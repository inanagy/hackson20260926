"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Progress from "@/components/Progress";
import ReflexChoice from "@/components/ReflexChoice";
import StimulusCard from "@/components/StimulusCard";
import type { ReflexChoice as Choice, ReflexResponse } from "@/lib/schemas";
import { emptySession, useSession, writeSession } from "@/lib/session";
import { STIMULI, STIMULUS_BY_ID } from "@/lib/stimuli";

const FIXATION_MS = 350;

function shuffle<T>(xs: T[]) {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ReflexPage() {
  const router = useRouter();
  const session = useSession();
  const [running, setRunning] = useState(false);
  const [index, setIndex] = useState(0);
  const [fixating, setFixating] = useState(true);
  const [shownIndex, setShownIndex] = useState<number | null>(null);
  const shownAt = useRef(0);

  const order = session?.order ?? [];
  const stimulus = running ? STIMULUS_BY_ID.get(order[index]) : undefined;
  const ready = running && !fixating && shownIndex === index;

  useEffect(() => {
    if (!running || !fixating) return;
    const t = setTimeout(() => setFixating(false), FIXATION_MS);
    return () => clearTimeout(t);
  }, [running, fixating, index]);

  function start() {
    STIMULI.forEach((s) => {
      new Image().src = s.src;
    });
    writeSession({ ...emptySession(), order: shuffle(STIMULI.map((s) => s.id)) });
    setIndex(0);
    setShownIndex(null);
    setFixating(true);
    setRunning(true);
  }

  function markShown() {
    shownAt.current = performance.now();
    setShownIndex(index);
  }

  function answer(choice: Choice) {
    if (!ready || !session || !stimulus) return;
    const now = performance.now();
    const existing = session.reflex.find((r) => r.stimulusId === stimulus.id);
    const reflex: ReflexResponse[] = existing
      ? session.reflex.map((r) =>
          r === existing
            ? { ...r, choice, changedChoice: r.changedChoice || r.choice !== choice }
            : r,
        )
      : [
          ...session.reflex,
          {
            stimulusId: stimulus.id,
            shownAt: performance.timeOrigin + shownAt.current,
            answeredAt: performance.timeOrigin + now,
            latencyMs: Math.round(now - shownAt.current),
            choice,
            dwellMs: 0,
            replayCount: 0,
            revisitCount: 0,
            changedChoice: false,
          },
        ];
    writeSession({ reflex });

    if (index + 1 >= order.length) {
      router.push("/experience/reflect");
      return;
    }
    setIndex(index + 1);
    setFixating(true);
  }

  function back() {
    if (!running || index === 0 || !session) return;
    const prevId = order[index - 1];
    writeSession({
      reflex: session.reflex.map((r) =>
        r.stimulusId === prevId ? { ...r, revisitCount: r.revisitCount + 1 } : r,
      ),
    });
    setIndex(index - 1);
    setFixating(true);
  }

  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
    const key = e.key.toLowerCase();
    if (!running) {
      if (key === " " || key === "enter") {
        e.preventDefault();
        start();
      }
      return;
    }
    if (key === "arrowleft" || key === "f") answer("skip");
    else if (key === "arrowright" || key === "j") answer("attracted");
    else if (key === "backspace" || key === "z") back();
  });

  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!running) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <p className="rise font-mono text-xs tracking-[0.3em] text-muted">フェーズ 1</p>
        <h1 className="rise mt-6 font-serif text-5xl">考える前に</h1>
        <div className="rise mt-10 space-y-1 font-serif text-2xl text-muted" style={{ animationDelay: "0.2s" }}>
          <p>説明しないで。</p>
          <p>ただ、反応して。</p>
        </div>
        <div
          className="rise mt-12 grid max-w-md grid-cols-2 gap-6 text-sm text-muted"
          style={{ animationDelay: "0.4s" }}
        >
          <p>
            <kbd className="font-mono text-foreground">← / F</kbd>
            <br />
            惹かれない
          </p>
          <p>
            <kbd className="font-mono text-accent">→ / J</kbd>
            <br />
            惹かれる
          </p>
        </div>
        <p className="rise mt-6 text-xs text-muted" style={{ animationDelay: "0.4s" }}>
          写真 {STIMULI.length} 枚 · 最初の感覚のままに · <kbd className="font-mono">Z</kbd> で1つ戻る
        </p>
        <button
          type="button"
          onClick={start}
          className="rise mt-12 rounded-full border border-accent/60 px-8 py-3 text-sm text-accent transition hover:bg-accent hover:text-background"
          style={{ animationDelay: "0.6s" }}
        >
          はじめる <span className="ml-2 font-mono text-xs opacity-70">Space</span>
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-8 px-6 py-10">
      <Progress current={index} total={order.length} />
      <div className="relative aspect-square w-full">
        {fixating ? (
          <div className="absolute inset-0 flex items-center justify-center font-mono text-3xl text-muted">+</div>
        ) : (
          stimulus && <StimulusCard stimulus={stimulus} visible={ready} onShown={markShown} />
        )}
      </div>
      <ReflexChoice disabled={!ready} onChoose={answer} />
    </main>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Progress from "@/components/Progress";
import StimulusCard from "@/components/StimulusCard";
import VoiceInput from "@/components/VoiceInput";
import type { Reflection, Stimulus } from "@/lib/schemas";
import { calculateImplicitResponse, selectForReflection } from "@/lib/scoring";
import { useSession, writeSession } from "@/lib/session";
import { STIMULUS_BY_ID } from "@/lib/stimuli";

const SCALE = ["まったく", "少し", "ある程度", "よく", "とても"];

const QUESTIONS = [
  { key: "pastValue", label: "昔、このようなものはあなたの生活の一部でしたか？" },
  { key: "currentPresence", label: "今、このようなものはあなたの生活にありますか？" },
  { key: "explicitPreference", label: "今でも惹かれますか？" },
] as const;

type ScaleKey = (typeof QUESTIONS)[number]["key"];

export default function ReflectPage() {
  const router = useRouter();
  const session = useSession();
  const [step, setStep] = useState(0);

  if (!session) return null;
  if (session.reflex.length === 0) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <p className="text-muted">このセッションでは、フェーズ1がまだ完了していません。</p>
        <Link href="/experience/reflex" className="text-accent underline underline-offset-4">
          最初からはじめる
        </Link>
      </main>
    );
  }

  const selected = selectForReflection(session.reflex, calculateImplicitResponse(session.reflex));
  const stimulus = STIMULUS_BY_ID.get(selected[step]);
  if (!stimulus) return null;

  function save(r: Reflection) {
    writeSession({
      reflections: { ...session!.reflections, [r.stimulusId]: r },
      analysis: null,
    });
    if (step + 1 >= selected.length) router.push("/experience/result");
    else setStep(step + 1);
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-6 py-12">
      <header className="space-y-6">
        <Progress current={step} total={selected.length} />
        {step === 0 && (
          <div className="rise text-center">
            <p className="font-mono text-xs tracking-[0.3em] text-muted">フェーズ 2</p>
            <h1 className="mt-4 font-serif text-5xl">考えたあとで</h1>
            <p className="mt-4 text-sm text-muted">
              さっき見た写真のうち、いくつかをもう一度。今度は、ゆっくり考えてください。
            </p>
          </div>
        )}
      </header>
      <ReflectionForm
        key={stimulus.id}
        stimulus={stimulus}
        initial={session.reflections[stimulus.id]}
        isLast={step + 1 >= selected.length}
        onBack={step > 0 ? () => setStep(step - 1) : undefined}
        onSubmit={save}
      />
    </main>
  );
}

function ReflectionForm({
  stimulus,
  initial,
  isLast,
  onBack,
  onSubmit,
}: {
  stimulus: Stimulus;
  initial?: Reflection;
  isLast: boolean;
  onBack?: () => void;
  onSubmit: (r: Reflection) => void;
}) {
  const [values, setValues] = useState<Record<ScaleKey, number | null>>({
    pastValue: initial?.pastValue ?? null,
    currentPresence: initial?.currentPresence ?? null,
    explicitPreference: initial?.explicitPreference ?? null,
  });
  const [text, setText] = useState(initial?.reflection ?? "");
  const complete = QUESTIONS.every((q) => values[q.key] !== null);

  return (
    <form
      className="rise grid gap-10 sm:grid-cols-[180px_1fr]"
      onSubmit={(e) => {
        e.preventDefault();
        if (!complete) return;
        onSubmit({
          stimulusId: stimulus.id,
          pastValue: values.pastValue!,
          currentPresence: values.currentPresence!,
          explicitPreference: values.explicitPreference!,
          reflection: text.trim(),
        });
      }}
    >
      <div className="mx-auto w-40 sm:w-full">
        <StimulusCard stimulus={stimulus} />
        <p className="mt-3 text-center text-sm text-muted">
          {stimulus.category}
        </p>
      </div>

      <div className="space-y-8">
        {QUESTIONS.map((q, qi) => (
          <fieldset key={q.key}>
            <legend className="mb-3 text-sm">
              <span className="mr-2 font-mono text-xs text-muted">Q{qi + 1}</span>
              {q.label}
            </legend>
            <div className="grid grid-cols-5 gap-2">
              {SCALE.map((label, v) => {
                const on = values[q.key] === v;
                return (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setValues({ ...values, [q.key]: v })}
                    className={`rounded-lg border px-1 py-2 text-center transition ${
                      on
                        ? "border-accent bg-accent/15 text-accent"
                        : "border-line text-muted hover:border-muted hover:text-foreground"
                    }`}
                  >
                    <span className="block font-mono text-sm">{v}</span>
                    <span className="block text-[10px] leading-tight">{label}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}

        <label className="block">
          <span className="mb-3 block text-sm">
            <span className="mr-2 font-mono text-xs text-muted">Q4</span>
            なぜそう思いますか？
          </span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={600}
            rows={3}
            placeholder="任意 — 一、二文で十分です。声でも答えられます。"
            className="w-full resize-none rounded-lg border border-line bg-transparent p-3 text-sm outline-none placeholder:text-muted/60 focus:border-muted"
          />
        </label>
        <VoiceInput onTranscript={(t) => setText((prev) => (prev ? `${prev} ${t}` : t).slice(0, 600))} />

        <div className="flex items-center justify-between">
          {onBack ? (
            <button type="button" onClick={onBack} className="text-sm text-muted hover:text-foreground">
              ← 戻る
            </button>
          ) : (
            <span />
          )}
          <button
            type="submit"
            disabled={!complete}
            className="rounded-full border border-accent/60 px-6 py-2 text-sm text-accent transition hover:bg-accent hover:text-background disabled:pointer-events-none disabled:opacity-30"
          >
            {isLast ? "残っているものを見る" : "次へ"}
          </button>
        </div>
      </div>
    </form>
  );
}

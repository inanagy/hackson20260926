"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import LatentSelfMap from "@/components/LatentSelfMap";
import SaudadeCard from "@/components/SaudadeCard";
import type { AnalyzeItem, Analysis, LatentInsight, LatentState } from "@/lib/schemas";
import { calculateImplicitResponse, scoreReflection, type ScoredItem } from "@/lib/scoring";
import { resetSession, useSession, writeSession, type SessionData } from "@/lib/session";
import { STIMULUS_BY_ID } from "@/lib/stimuli";

function score(session: SessionData) {
  const implicit = calculateImplicitResponse(session.reflex);
  return Object.values(session.reflections)
    .filter((r) => implicit.has(r.stimulusId) && STIMULUS_BY_ID.has(r.stimulusId))
    .map((r) => scoreReflection(r, implicit.get(r.stimulusId)!));
}

const category = (id: string) => STIMULUS_BY_ID.get(id)!.category;

const STATE_LABEL: Record<LatentState, string> = {
  active: "今の自己",
  dormant: "眠っている自己",
  past_only: "過去の自己",
  emerging: "芽生え",
};

const CONFIDENCE_LABEL: Record<LatentInsight["confidence"], string> = {
  low: "低",
  medium: "中",
  high: "高",
};

let inflight: Promise<void> | null = null;

async function requestAnalysis(items: ScoredItem[]) {
  const payload: AnalyzeItem[] = items.map((i) => ({
    category: category(i.stimulusId),
    state: i.state,
    pastValue: i.pastValue,
    currentPresence: i.currentPresence,
    implicitResponse: i.implicitResponse,
    explicitPreference: i.explicitPreference,
    latentGap: i.latentGap,
    saudadeScore: i.saudadeScore,
    reflection: i.reflection,
  }));
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: payload }),
  });
  if (!res.ok) throw new Error(`analyze ${res.status}`);
  writeSession({ analysis: (await res.json()) as Analysis });
}

export default function ResultPage() {
  const session = useSession();
  const [failed, setFailed] = useState(false);

  const items = useMemo(() => (session ? score(session) : []), [session]);
  const needsAnalysis = !!session && items.length > 0 && !session.analysis && !failed;

  useEffect(() => {
    if (!needsAnalysis || inflight) return;
    inflight = requestAnalysis(items)
      .catch(() => setFailed(true))
      .finally(() => {
        inflight = null;
      });
  }, [needsAnalysis, items]);

  if (!session) return null;
  if (items.length === 0) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <p className="text-muted">まだ表示できるものがありません。</p>
        <Link href="/experience/reflex" className="text-accent underline underline-offset-4">
          最初からはじめる
        </Link>
      </main>
    );
  }

  const insights = session.analysis?.insights ?? [];
  const insightFor = (i: ScoredItem): LatentInsight | undefined =>
    insights.find((x) => x.categories.includes(category(i.stimulusId)));

  const byState = (s: LatentState) =>
    items.filter((i) => i.state === s).sort((a, b) => b.saudadeScore - a.saudadeScore);
  const dormant = byState("dormant");
  const active = byState("active");
  const past = byState("past_only");
  const emerging = byState("emerging");
  const [hero, ...otherDormant] = dormant;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-20 px-6 py-16">
      <header className="rise text-center">
        <p className="font-mono text-xs tracking-[0.3em] text-muted">フェーズ 3</p>
        <h1 className="mt-4 font-serif text-5xl">あなたの潜在自己</h1>
      </header>

      <section className="rise space-y-6" style={{ animationDelay: "0.2s" }}>
        <SectionTitle label="眠っている自己" note="過去の価値 高 · 現在 低 · 反応 高" color="text-dormant" />
        {hero ? (
          <>
            <SaudadeCard
              item={hero}
              stimulus={STIMULUS_BY_ID.get(hero.stimulusId)!}
              insight={insightFor(hero)}
              hero
            />
            {otherDormant.map((i) => (
              <SaudadeCard key={i.stimulusId} item={i} stimulus={STIMULUS_BY_ID.get(i.stimulusId)!} />
            ))}
            <p className="pt-6 text-center font-serif text-3xl leading-relaxed sm:text-4xl">
              やめたのは、
              <br />
              <span className="text-accent">反応しなくなるより先だった。</span>
            </p>
          </>
        ) : (
          <p className="rounded-2xl border border-line p-8 text-center text-sm text-muted">
            今回は、眠っている自己は浮かび上がりませんでした。かつて大切だったものは、今も生活の中にあるか、
            それへの反応も静かになっているようです。
          </p>
        )}
      </section>

      <section className="rise space-y-6" style={{ animationDelay: "0.4s" }}>
        <SectionTitle label="それぞれの位置" note="過去の価値 × 現在の生活" />
        <LatentSelfMap
          points={items.map((i) => ({
            id: i.stimulusId,
            label: category(i.stimulusId),
            past: i.pastValue,
            current: i.currentPresence,
            implicit: i.implicitResponse,
            state: i.state,
          }))}
        />
      </section>

      <div className="grid gap-12 sm:grid-cols-2">
        <Group label="今の自己" note="現在 高 · 反応 高" color="text-active" items={active} />
        <Group label="過去の自己" note="過去 高 · 現在 低 · 反応 低" color="text-past" items={past} />
        {emerging.length > 0 && (
          <Group label="芽生え" note="過去 低 · 反応 高" color="text-emerging" items={emerging} />
        )}
      </div>

      <section className="space-y-6">
        <SectionTitle label="何が残っている？" note="上の数値をもとにLLMが書いた文章" />
        {session.analysis ? (
          <div className="space-y-6">
            {insights.map((x) => (
              <article key={x.theme} className="space-y-3 border-l border-line pl-5">
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <h3 className="font-serif text-2xl">{x.theme}</h3>
                  <span className="text-[11px] text-muted">
                    {STATE_LABEL[x.state]} · 確信度 {CONFIDENCE_LABEL[x.confidence]}
                  </span>
                </div>
                <p className="text-sm leading-relaxed">{x.observation}</p>
                <ul className="space-y-1 text-xs text-muted">
                  {x.evidence.map((e) => (
                    <li key={e}>— {e}</li>
                  ))}
                </ul>
                <p className="font-serif text-lg leading-relaxed text-accent">{x.reflection}</p>
              </article>
            ))}
          </div>
        ) : failed ? (
          <div className="flex items-center gap-4 text-sm text-muted">
            <p>今は振り返りの文章を書けませんでした。</p>
            <button type="button" onClick={() => setFailed(false)} className="text-accent underline underline-offset-4">
              再試行
            </button>
          </div>
        ) : (
          <p className="animate-pulse text-sm text-muted">あなたがしたことと、言ったことのあいだを読んでいます…</p>
        )}
      </section>

      <footer className="space-y-10 border-t border-line pt-16 text-center">
        <div className="space-y-3 font-serif text-2xl sm:text-3xl">
          <p>記憶は、かつてあったものを表す。</p>
          <p className="text-accent">ここに映るのは、今もまだ期待されているもの。</p>
        </div>
        <p className="mx-auto max-w-md text-xs leading-relaxed text-muted">
          私たちは、あなたの無意識を測っているわけではありません。見ているのは、もっと単純なシグナルです。
          あなたが言うこと、すること、かつて大切にしていたこと、そして生活から消えたもの。そのあいだのズレです。
        </p>
        <Link
          href="/"
          onClick={() => resetSession()}
          className="inline-block text-sm text-muted underline underline-offset-4 hover:text-foreground"
        >
          最初からやり直す
        </Link>
      </footer>
    </main>
  );
}

function SectionTitle({ label, note, color = "text-foreground" }: { label: string; note: string; color?: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3">
      <h2 className={`text-sm tracking-[0.2em] ${color}`}>{label}</h2>
      <span className="text-[11px] text-muted">{note}</span>
    </div>
  );
}

function Group({
  label,
  note,
  color,
  items,
}: {
  label: string;
  note: string;
  color: string;
  items: ScoredItem[];
}) {
  return (
    <section className="space-y-4">
      <SectionTitle label={label} note={note} color={color} />
      {items.length ? (
        items.map((i) => (
          <SaudadeCard key={i.stimulusId} item={i} stimulus={STIMULUS_BY_ID.get(i.stimulusId)!} />
        ))
      ) : (
        <p className="text-sm text-muted">今回はありません。</p>
      )}
    </section>
  );
}

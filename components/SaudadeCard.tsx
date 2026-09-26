import type { LatentInsight, Stimulus } from "@/lib/schemas";
import type { ScoredItem } from "@/lib/scoring";
import StimulusCard from "./StimulusCard";

type Props = {
  item: ScoredItem;
  stimulus: Stimulus;
  insight?: LatentInsight;
  hero?: boolean;
};

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.round(value * 100);
  return (
    <div className="grid grid-cols-[72px_1fr_40px] items-center gap-3 font-mono text-xs">
      <span className="text-muted">{label}</span>
      <div className="h-2 rounded-full bg-line">
        <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-right tabular-nums">{pct}%</span>
    </div>
  );
}

export default function SaudadeCard({ item, stimulus, insight, hero = false }: Props) {
  const color =
    item.state === "active"
      ? "var(--active)"
      : item.state === "past_only"
        ? "var(--past)"
        : item.state === "emerging"
          ? "var(--emerging)"
          : "var(--dormant)";

  return (
    <article
      className={`rounded-2xl border border-line bg-white/[0.02] ${
        hero ? "grid gap-8 p-8 sm:grid-cols-[200px_1fr]" : "flex gap-4 p-4"
      }`}
    >
      <div className={hero ? "mx-auto w-48 sm:w-full" : "w-16 shrink-0"}>
        <StimulusCard stimulus={stimulus} className={hero ? "" : "rounded-lg shadow-none"} />
      </div>
      <div className="min-w-0 flex-1 space-y-3">
        <h3 className={`font-serif capitalize ${hero ? "text-4xl" : "text-xl"}`}>{stimulus.category}</h3>
        <div className="space-y-2">
          <Bar label="過去" value={item.pastValue} color={color} />
          <Bar label="現在" value={item.currentPresence} color={color} />
          <Bar label="反応" value={item.implicitResponse} color={color} />
          {hero && <Bar label="自己申告" value={item.explicitPreference} color="var(--muted)" />}
        </div>
        {hero && item.reflection && (
          <p className="border-l border-line pl-3 text-sm text-muted">「{item.reflection}」</p>
        )}
        {insight && hero && <p className="text-sm leading-relaxed">{insight.reflection}</p>}
      </div>
    </article>
  );
}

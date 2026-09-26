import type { LatentState } from "@/lib/schemas";

export type MapPoint = {
  id: string;
  label: string;
  past: number;
  current: number;
  implicit: number;
  state: LatentState | null;
};

const COLOR: Record<LatentState | "none", string> = {
  dormant: "var(--dormant)",
  active: "var(--active)",
  past_only: "var(--past)",
  emerging: "var(--emerging)",
  none: "var(--muted)",
};

const SIZE = 520;
const PAD = 40;
const INNER = SIZE - PAD * 2;

export default function LatentSelfMap({ points }: { points: MapPoint[] }) {
  // Likert answers collide on the same grid cell; spread each group evenly on a ring.
  const groups = new Map<string, number[]>();
  points.forEach((p, i) => {
    const key = `${p.current}:${p.past}`;
    groups.set(key, [...(groups.get(key) ?? []), i]);
  });
  const placed = points.map((p, i) => {
    const group = groups.get(`${p.current}:${p.past}`)!;
    const k = group.indexOf(i);
    const ring = group.length > 1 ? 30 + group.length * 4 : 0;
    const angle = (2 * Math.PI * k) / group.length - Math.PI / 2;
    return {
      ...p,
      x: PAD + (0.12 + 0.76 * p.current) * INNER + Math.cos(angle) * ring,
      y: PAD + (0.12 + 0.76 * (1 - p.past)) * INNER + Math.sin(angle) * ring,
    };
  });

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="mx-auto w-full max-w-xl"
        role="img"
        aria-label="過去の価値と現在の生活の関係を示すマップ。円の大きさは直感的な反応の強さ"
      >
        <rect
          x={PAD}
          y={PAD}
          width={INNER / 2}
          height={INNER / 2}
          fill="var(--dormant)"
          opacity={0.07}
          rx={6}
        />
        <text x={PAD + 10} y={PAD + INNER / 2 - 10} fontSize={10} letterSpacing={3} fill="var(--dormant)" opacity={0.8}>
          眠っている自己
        </text>

        <line x1={PAD + INNER / 2} y1={PAD - 8} x2={PAD + INNER / 2} y2={PAD + INNER + 8} stroke="var(--line)" />
        <line x1={PAD - 8} y1={PAD + INNER / 2} x2={PAD + INNER + 8} y2={PAD + INNER / 2} stroke="var(--line)" />

        <text x={PAD + INNER / 2} y={PAD - 18} fontSize={10} letterSpacing={2} textAnchor="middle" fill="var(--muted)">
          過去の価値 ↑
        </text>
        <text
          x={PAD + INNER / 2}
          y={SIZE - 14}
          fontSize={10}
          letterSpacing={2}
          textAnchor="middle"
          fill="var(--muted)"
        >
          現在の生活 →
        </text>

        {placed.map((p) => (
          <g key={p.id}>
            <circle
              cx={p.x}
              cy={p.y}
              r={5 + p.implicit * 13}
              fill={COLOR[p.state ?? "none"]}
              fillOpacity={0.25 + p.implicit * 0.6}
              stroke={COLOR[p.state ?? "none"]}
            />
            <text
              x={p.x}
              y={p.y + 8 + 5 + p.implicit * 13}
              fontSize={9}
              textAnchor="middle"
              fill="var(--foreground)"
              opacity={0.85}
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>
      <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[11px] text-muted">
        <Legend color="var(--active)" label="今の自己" />
        <Legend color="var(--dormant)" label="眠っている自己" />
        <Legend color="var(--past)" label="過去の自己" />
        <Legend color="var(--emerging)" label="芽生え" />
        <span>円の大きさ = 直感的な反応</span>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

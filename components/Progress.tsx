export default function Progress({ current, total }: { current: number; total: number }) {
  const pct = total ? Math.min(100, (current / total) * 100) : 0;
  return (
    <div className="flex items-center gap-4 font-mono text-xs text-muted">
      <div className="h-px flex-1 bg-line">
        <div className="h-px bg-accent transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
      <span className="tabular-nums">
        {Math.min(current, total)} / {total}
      </span>
    </div>
  );
}

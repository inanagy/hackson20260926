import type { ReflexChoice as Choice } from "@/lib/schemas";

type Props = {
  disabled: boolean;
  onChoose: (choice: Choice) => void;
};

const base =
  "flex flex-1 items-center justify-center gap-3 rounded-full border px-6 py-4 text-sm transition disabled:opacity-30";

export default function ReflexChoice({ disabled, onChoose }: Props) {
  return (
    <div className="flex w-full gap-4">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChoose("skip")}
        className={`${base} border-line text-muted hover:border-muted hover:text-foreground`}
      >
        <kbd className="font-mono text-xs opacity-70">← F</kbd>
        惹かれない
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChoose("attracted")}
        className={`${base} border-accent/50 text-accent hover:bg-accent hover:text-background`}
      >
        惹かれる
        <kbd className="font-mono text-xs opacity-70">J →</kbd>
      </button>
    </div>
  );
}

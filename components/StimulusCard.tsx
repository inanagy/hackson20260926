import type { Stimulus } from "@/lib/schemas";

type Props = {
  stimulus: Stimulus;
  visible?: boolean;
  onShown?: () => void;
  className?: string;
};

export default function StimulusCard({ stimulus, visible = true, onShown, className = "" }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- onLoad must mark the exact moment the stimulus is painted
    <img
      key={stimulus.id}
      src={stimulus.src}
      alt=""
      draggable={false}
      onLoad={onShown}
      className={`aspect-square w-full select-none rounded-2xl object-cover shadow-2xl transition-opacity duration-100 ${
        visible ? "opacity-100" : "opacity-0"
      } ${className}`}
    />
  );
}

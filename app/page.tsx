import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="max-w-2xl text-center">
        <h1 className="rise font-serif text-4xl leading-snug sm:text-5xl">
          生活からは消えたのに、
          <br />
          <span className="text-accent">心はまだ反応している。</span>
        </h1>
        <div
          className="rise mx-auto mt-12 max-w-lg space-y-5 text-base leading-relaxed text-muted"
          style={{ animationDelay: "0.3s" }}
        >
          <p>ふつうのAIは、あなたが「今」何を好きかを学習します。</p>
          <p className="font-serif text-xl leading-relaxed text-foreground">
            ここで探すのは、かつて大切にしていて、
            <br className="hidden sm:block" />
            今は生活から消えたのに、
            <br className="hidden sm:block" />
            まだあなたの反応を動かしているものです。
          </p>
        </div>
        <ol
          className="rise mx-auto mt-12 grid max-w-lg grid-cols-3 gap-4 text-xs text-muted"
          style={{ animationDelay: "0.45s" }}
        >
          <li className="border-t border-line pt-3">
            <span className="block font-mono text-accent">01</span>
            写真に、直感で反応する
          </li>
          <li className="border-t border-line pt-3">
            <span className="block font-mono text-accent">02</span>
            あとから、言葉で振り返る
          </li>
          <li className="border-t border-line pt-3">
            <span className="block font-mono text-accent">03</span>
            そのズレに、残っているものが映る
          </li>
        </ol>
        <div className="rise mt-14" style={{ animationDelay: "0.6s" }}>
          <Link
            href="/experience/reflex"
            className="inline-block rounded-full border border-accent/60 px-8 py-3 text-sm tracking-wide text-accent transition hover:bg-accent hover:text-background"
          >
            私の潜在自己をたどる
          </Link>
          <p className="mt-6 text-xs text-muted">
            約3分 · 回答はこのブラウザの中だけに保存されます
          </p>
        </div>
      </div>
    </main>
  );
}

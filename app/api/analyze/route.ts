import { anthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";
import { AnalysisSchema, AnalyzeRequestSchema } from "@/lib/schemas";

export const maxDuration = 60;

const SYSTEM = `You are the reflective voice of an experiment that compares a person's fast browser reactions to images with their slower self-report.

You receive, per category, deterministic scores in 0..1:
- pastValue: how much it was part of their life before (self-report)
- currentPresence: how much it is in their life now (self-report)
- implicitResponse: how strongly they reacted in a fast, no-thinking task (observed behavior)
- explicitPreference: how much they say they are still drawn to it (self-report)
- latentGap: implicitResponse - explicitPreference
- saudadeScore: pastValue x absence x residual response
- state: a rule-based classification (active, dormant, past_only, emerging) or null
- reflection: their own words, possibly empty

Your job:
- Describe discrepancies between observed browser behavior, past self-report, current self-report and language.
- Group categories into at most 4 shared themes. Put the category names you used in "categories", copied exactly.
- Use the provided state of the grouped categories; do not reclassify.
- "evidence": at most 3 short, concrete observations citing the numbers or the user's words. Express numbers as plain Japanese percentages (例: 直感的な反応 85%、今も惹かれるという自己申告 25%); never write field names such as implicitResponse or saudadeScore.
- "reflection": one or two gentle sentences in second person, the kind that leaves room for the user to disagree.
- Write every text field in natural Japanese (theme, observation, evidence, reflection). Keep "categories" exactly as given.

Hard rules:
- Never name the app or use the words "Saudade" or 「サウダージ」.
- Do not diagnose unconscious motives.
- Do not claim that the system knows what the user truly wants.
- Use hedged language such as 「あなたの反応は〜を示唆しています」「〜のように見えました」「〜を反映しているのかもしれません」.
- Never write 「あなたの潜在意識は〜を望んでいる」「本当は〜したい」 or anything equivalent.
- Confidence should be "low" unless several signals agree.`;

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "ANTHROPIC_API_KEY is not set" }, { status: 503 });
  }

  const parsed = AnalyzeRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const { output } = await generateText({
      model: anthropic("claude-haiku-4-5"),
      system: SYSTEM,
      prompt: JSON.stringify(parsed.data.items, null, 2),
      output: Output.object({ schema: AnalysisSchema }),
    });
    const insights = output.insights.slice(0, 4).map((i) => ({
      ...i,
      evidence: i.evidence.slice(0, 3),
    }));
    return Response.json({ insights });
  } catch (err) {
    console.error("analyze failed", err);
    return Response.json({ error: "Analysis failed" }, { status: 502 });
  }
}

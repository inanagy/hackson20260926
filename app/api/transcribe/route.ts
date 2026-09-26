import { openai } from "@ai-sdk/openai";
import { transcribe } from "ai";

export const maxDuration = 30;

// 15 seconds of compressed speech is well under this; anything larger is not a reflection clip.
const MAX_BYTES = 3 * 1024 * 1024;

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: "OPENAI_API_KEY is not set" }, { status: 503 });
  }

  const form = await req.formData().catch(() => null);
  const audio = form?.get("audio");
  if (!(audio instanceof Blob) || audio.size === 0 || audio.size > MAX_BYTES) {
    return Response.json({ error: "Invalid audio" }, { status: 400 });
  }

  try {
    const result = await transcribe({
      model: openai.transcription("gpt-4o-mini-transcribe"),
      audio: new Uint8Array(await audio.arrayBuffer()),
      providerOptions: { openai: { language: "ja" } },
    });
    return Response.json({ transcript: result.text.trim() });
  } catch (err) {
    console.error("transcribe failed", err);
    return Response.json({ error: "Transcription failed" }, { status: 502 });
  }
}

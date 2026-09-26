# Saudade — Latent Self Visualizer

> Jev models reflex. LLMs model reason. Saudade models what remains.

Compares fast, unexplained reactions to images (Phase 1) with slower self-report (Phase 2), and surfaces things that were once valued, have left daily life, but still draw a response.

## Run locally

```bash
cp .env.example .env.local   # set ANTHROPIC_API_KEY and OPENAI_API_KEY
npm install
npm run dev
```

Open http://localhost:3000. Without an API key everything works except the final LLM reflection.

## Deploy

Import the repository in Vercel and set `ANTHROPIC_API_KEY` as an environment variable. No database is needed; session data lives in `sessionStorage`.

## Structure

- `app/experience/reflex` — Phase 1, Before I Think. Keyboard (`F`/`J`, `←`/`→`, `Z` to go back) or mouse. No LLM involved.
- `app/experience/reflect` — Phase 2, After I Think. Past value, current presence and explicit preference (0–4) plus a free-text reason, for the 3 strongest and 1 most hesitant response. The reason can be spoken (up to 15 s, transcribed by OpenAI, audio not stored).
- `app/experience/result` — Phase 3, Your Latent Self.
- `app/api/analyze` — the only LLM call (Claude via the Vercel AI SDK, Zod structured output). Receives scores only, never raw events.
- `lib/scoring.ts` — deterministic scoring: implicit response, absence, latent gap, Saudade score, state classification.

## Stimuli

`public/stimuli/images/*.jpg` are 35mm film photos, center-cropped to 900×900. To swap one, replace the file with the same name or edit `lib/stimuli.ts`.

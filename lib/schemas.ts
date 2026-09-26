import { z } from "zod";

export type Stimulus = {
  id: string;
  modality: "image" | "audio";
  src: string;
  category: string;
  tags: string[];
};

export type ReflexChoice = "attracted" | "skip";

export type ReflexResponse = {
  stimulusId: string;
  shownAt: number;
  answeredAt: number;
  latencyMs: number;
  choice: ReflexChoice;
  dwellMs: number;
  replayCount: number;
  revisitCount: number;
  changedChoice: boolean;
};

export type Reflection = {
  stimulusId: string;
  pastValue: number;
  currentPresence: number;
  explicitPreference: number;
  reflection: string;
};

export const LatentStateSchema = z.enum([
  "active",
  "dormant",
  "past_only",
  "emerging",
]);
export type LatentState = z.infer<typeof LatentStateSchema>;

const unit = z.number().min(0).max(1);

export const AnalyzeItemSchema = z.object({
  category: z.string().max(80),
  state: LatentStateSchema.nullable(),
  pastValue: unit,
  currentPresence: unit,
  implicitResponse: unit,
  explicitPreference: unit,
  latentGap: z.number().min(-1).max(1),
  saudadeScore: unit,
  reflection: z.string().max(1000),
});
export type AnalyzeItem = z.infer<typeof AnalyzeItemSchema>;

export const AnalyzeRequestSchema = z.object({
  items: z.array(AnalyzeItemSchema).min(1).max(12),
});

// Length limits are enforced after generation: Claude's native structured
// output rejects some JSON Schema constraints such as maxItems.
export const LatentInsightSchema = z.object({
  theme: z.string(),
  categories: z.array(z.string()),
  state: LatentStateSchema,
  observation: z.string(),
  evidence: z.array(z.string()),
  reflection: z.string(),
  confidence: z.enum(["low", "medium", "high"]),
});
export type LatentInsight = z.infer<typeof LatentInsightSchema>;

export const AnalysisSchema = z.object({
  insights: z.array(LatentInsightSchema),
});
export type Analysis = z.infer<typeof AnalysisSchema>;

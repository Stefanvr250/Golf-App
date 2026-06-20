import { z } from "zod";

export const predictionTypes = [
  "winner",
  "score_guess",
  "best_performer",
  "worst_performer",
] as const;

export const predictionSchema = z.object({
  tournamentId: z.string().uuid(),
  predictionType: z.enum(predictionTypes),
  targetUserId: z.string().uuid().optional(),
  predictedValue: z.string().max(100).optional(),
});

export const predictionBatchSchema = z.object({
  tournamentId: z.string().uuid(),
  predictions: z.array(predictionSchema).min(1),
});

export type PredictionInput = z.infer<typeof predictionSchema>;
export type PredictionType = (typeof predictionTypes)[number];

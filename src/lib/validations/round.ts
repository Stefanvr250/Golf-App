import { z } from "zod";

export const holeScoreSchema = z.object({
  holeNumber: z.number().int().min(1).max(36),
  strokes: z.number().int().min(0).max(20),
  putts: z.number().int().min(0).max(15).optional(),
  penalties: z.number().int().min(0).max(10).default(0),
  fairwayHit: z.enum(["yes", "no", "na"]).optional(),
  greenInRegulation: z.boolean().optional(),
  upAndDown: z.boolean().optional(),
  sandSave: z.boolean().optional(),
});

export const shotSchema = z.object({
  shotNumber: z.number().int().min(1).max(20),
  club: z.string().max(20).optional(),
  lieType: z
    .enum(["tee", "fairway", "rough", "bunker", "green", "fringe", "recovery"])
    .optional(),
  startLat: z.number().min(-90).max(90).optional(),
  startLng: z.number().min(-180).max(180).optional(),
  endLat: z.number().min(-90).max(90).optional(),
  endLng: z.number().min(-180).max(180).optional(),
  distanceYards: z.number().min(0).max(800).optional(),
});

export const roundCreateSchema = z.object({
  courseId: z.string().uuid(),
  teeSetId: z.string().uuid().optional(),
  tournamentId: z.string().uuid().optional(),
  date: z.string().date().optional(),
});

export const roundSyncSchema = z.object({
  rounds: z
    .array(
      z.object({
        offlineId: z.string().min(1),
        courseId: z.string().uuid(),
        teeSetId: z.string().uuid().optional(),
        tournamentId: z.string().uuid().optional(),
        date: z.string().date().optional(),
        scores: z.array(holeScoreSchema),
      })
    )
    .min(1),
});

export type HoleScoreInput = z.infer<typeof holeScoreSchema>;
export type RoundCreateInput = z.infer<typeof roundCreateSchema>;
export type RoundSyncInput = z.infer<typeof roundSyncSchema>;

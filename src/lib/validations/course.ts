import { z } from "zod";

export const teeSetInputSchema = z.object({
  name: z.string().min(1, "Tee name is required").max(50),
  color: z.string().max(30).optional(),
  courseRating: z.number().min(50).max(90).optional(),
  slopeRating: z.number().int().min(55).max(155).optional(),
  // yardage per hole, indexed by hole number (1-based)
  yardages: z.array(z.number().int().positive()).optional(),
});

export const holeInputSchema = z.object({
  holeNumber: z.number().int().min(1).max(36),
  par: z.number().int().min(3).max(6),
  handicapIndex: z.number().int().min(1).max(18).optional(),
});

export const courseCreateSchema = z.object({
  name: z.string().min(2, "Course name is required").max(120),
  address: z.string().max(200).optional(),
  city: z.string().max(80).optional(),
  province: z.string().max(80).optional(),
  country: z.string().max(80).default("South Africa"),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  numHoles: z.union([
    z.literal(9),
    z.literal(18),
    z.literal(27),
    z.literal(36),
  ]),
  holes: z.array(holeInputSchema).min(1, "At least one hole is required"),
  teeSets: z.array(teeSetInputSchema).optional(),
});

export const courseSearchOsmSchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().int().min(100).max(200000).default(50000),
  q: z.string().max(120).optional(),
});

export const courseImportOsmSchema = z.object({
  osmId: z.number().int(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export type CourseCreateInput = z.infer<typeof courseCreateSchema>;
export type TeeSetInput = z.infer<typeof teeSetInputSchema>;
export type HoleInput = z.infer<typeof holeInputSchema>;

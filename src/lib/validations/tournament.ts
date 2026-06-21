import { z } from "zod";

export const tournamentFormats = [
  "stroke_play",
  "stableford",
  "match_play",
  "ryder_cup",
  "skins",
] as const;

export const tournamentCreateSchema = z.object({
  name: z.string().min(2, "Tournament name is required").max(120),
  courseId: z.string().uuid(),
  format: z.enum(tournamentFormats),
  numHoles: z.union([z.literal(9), z.literal(18)]),
  maxParticipants: z.number().int().min(2).max(20).default(20),
  date: z.string().date(),
  leagueId: z.string().uuid().optional(),
});

export const tournamentInviteSchema = z.object({
  tournamentId: z.string().uuid(),
});

export const leagueCreateSchema = z.object({
  name: z.string().min(2, "League name is required").max(120),
  description: z.string().max(500).optional(),
});

export type TournamentCreateInput = z.infer<typeof tournamentCreateSchema>;
export type TournamentFormat = (typeof tournamentFormats)[number];
export type LeagueCreateInput = z.infer<typeof leagueCreateSchema>;

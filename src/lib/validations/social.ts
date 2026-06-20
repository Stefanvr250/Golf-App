import { z } from "zod";

export const chatMessageSchema = z
  .object({
    tournamentId: z.string().uuid(),
    message: z.string().max(1000).optional(),
    photoUrl: z.string().url().optional(),
  })
  .refine((data) => Boolean(data.message?.trim()) || Boolean(data.photoUrl), {
    message: "A message or a photo is required",
    path: ["message"],
  });

export const friendRequestSchema = z.object({
  addresseeId: z.string().uuid(),
});

export const friendResponseSchema = z.object({
  friendshipId: z.string().uuid(),
  status: z.enum(["accepted", "declined"]),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;

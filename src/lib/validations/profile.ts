import { z } from "zod";

export const profileUpdateSchema = z.object({
  displayName: z.string().min(2, "Display name is required").max(60),
  avatarUrl: z.string().url().optional(),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one digit"),
  displayName: z.string().min(2, "Display name is required").max(60),
  acceptedTerms: z.literal(true, {
    errorMap: () => ({ message: "You must accept the terms to continue" }),
  }),
});

export const changeRequestSchema = z.object({
  courseId: z.string().uuid(),
  description: z.string().min(5, "Please describe the change").max(1000),
  changes: z.record(z.string(), z.unknown()),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ChangeRequestInput = z.infer<typeof changeRequestSchema>;

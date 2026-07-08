import { z } from "zod";

export const roleSchema = z.enum(["ADMIN", "MEMBER"]);
export const lunchStatusSchema = z.enum(["BRING_LUNCH", "EAT_OUT", "NO_LUNCH", "UNDECIDED"]);
export const targetTypeSchema = z.enum(["POST", "COMMENT"]);
export const reactionTypeSchema = z.enum(["LIKE", "LOVE", "ANGRY"]);

export const loginSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  pin: z.string().min(4).max(20),
});

export const lunchEntrySchema = z.object({
  status: lunchStatusSchema,
  restaurantName: z.string().max(100).optional().default(""),
  foodName: z.string().max(100).optional().default(""),
  note: z.string().max(500).optional().default(""),
});

export const contentSchema = z.object({
  content: z.string().trim().min(1).max(1000),
});

export const commentCreateSchema = z.object({
  postId: z.string().min(1),
  content: z.string().trim().min(1).max(500),
});

export const postIdSchema = z.object({
  postId: z.string().min(1),
});

export const commentIdSchema = z.object({
  commentId: z.string().min(1),
});

export const reactionToggleSchema = z.object({
  targetType: targetTypeSchema,
  targetId: z.string().min(1),
  reactionType: reactionTypeSchema,
});

export const memberCreateSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  displayName: z.string().trim().min(1).max(100),
  role: roleSchema,
  pin: z.string().min(4).max(20),
});

export const userIdSchema = z.object({
  userId: z.string().min(1),
});

export const setPinSchema = z.object({
  userId: z.string().min(1),
  pin: z.string().min(4).max(20),
});

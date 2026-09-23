import { z } from "zod";

export const generatedContentSchema = z.object({
  title: z.string().trim().min(3).max(180),
  level: z.enum(["N5", "N4", "N3", "N2", "N1"]),
  summary: z.string().trim().min(20).max(20000),
  questions: z.array(z.object({
    question: z.string().trim().min(4).max(1000),
    options: z.array(z.string().trim().min(1).max(500)).length(4),
    answerIndex: z.number().int().min(0).max(3),
    explanation: z.string().trim().min(8).max(3000),
    sourceHint: z.string().trim().min(2).max(600),
  })).min(1).max(8),
});

export type GeneratedContent = z.infer<typeof generatedContentSchema>;

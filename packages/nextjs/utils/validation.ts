import { z } from "zod";

export const promptSchema = z.object({
  id: z.string(),
  game_id: z.string(),
  prompt_text: z.string(),
  creator_address: z.string(),
  is_agent_a: z.boolean(),
  tx_hash: z.string(),
  block_number: z.string(),
  status: z.enum(["pending", "completed", "failed"]),
  created_at: z.string().nullable(),
});

export type ValidPrompt = z.infer<typeof promptSchema>;

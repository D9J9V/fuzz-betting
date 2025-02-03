import { createPrompt } from "~~/lib/prompts";
import { supabase } from "~~/lib/supabaseClient";

export const syncPromptData = async (blockchainPrompt: any, dbPrompt: any) => {
  if (!dbPrompt) {
    // Create new prompt in database
    return createPrompt(
      BigInt(blockchainPrompt.id),
      BigInt(blockchainPrompt.gameId),
      "Pending...", // Default text
      blockchainPrompt.creator,
      blockchainPrompt.isAgentA,
      blockchainPrompt.txHash || "0x0",
      BigInt(0),
    );
  }

  // Update existing prompt if needed
  const { data, error } = await supabase
    .from("prompts")
    .update({
      votes: blockchainPrompt.votes.toString(),
      status: "completed",
    })
    .eq("id", dbPrompt.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

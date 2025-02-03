import { supabase } from "./supabaseClient";

export type PromptStatus = "pending" | "confirmed" | "completed" | "failed";

export const createPrompt = async (
  id: string | bigint,
  gameId: string | bigint,
  promptText: string,
  creatorAddress: string,
  isAgentA: boolean,
  txHash: string,
  votes: bigint,
  status: PromptStatus = "confirmed", // Add status parameter with default
) => {
  const { data, error } = await supabase.from("prompts").insert({
    id: id.toString(),
    game_id: gameId.toString(),
    prompt_text: promptText,
    creator_address: creatorAddress,
    is_agent_a: isAgentA,
    tx_hash: txHash,
    status: status,
    block_number: "0", // You might want to get the actual block number
  });

  if (error) throw error;
  return data;
};

export const getPrompts = async (gameId: bigint) => {
  const { data, error } = await supabase
    .from("prompts")
    .select(
      `
      *,
      creator:creator_address(address),
      votes:prompt_votes(
        amount,
        voter_address
      ),
      ai_responses(
        agent,
        response_text
      )
    `,
    )
    .eq("game_id", gameId.toString())
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching prompts:", error);
    throw error;
  }

  return data;
};

// Add new function for votes
export const addPromptVote = async (promptId: string, voterAddress: string, amount: string, txHash: string) => {
  const { data, error } = await supabase.from("prompt_votes").insert([
    {
      prompt_id: promptId,
      voter_address: voterAddress.toLowerCase(),
      amount,
      tx_hash: txHash,
    },
  ]);

  if (error) throw error;
  return data;
};

export const debugDatabase = async () => {
  const { data: users, error: usersError } = await supabase.from("users").select("*");

  if (usersError) {
    console.error("Error fetching users:", usersError);
    return;
  }

  console.log("All users in database:", users);

  const { data: prompts, error: promptsError } = await supabase.from("prompts").select("*");

  if (promptsError) {
    console.error("Error fetching prompts:", promptsError);
    return;
  }

  console.log("All prompts in database:", prompts);
};

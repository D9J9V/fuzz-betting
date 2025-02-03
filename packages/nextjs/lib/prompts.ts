import { supabase } from "./supabaseClient";

export const createPrompt = async (
  promptId: bigint,
  gameId: bigint,
  promptText: string,
  creatorAddress: string,
  isAgentA: boolean,
  txHash: string,
  blockNumber: bigint,
) => {
  const normalizedAddress = creatorAddress.toLowerCase();

  // Add error handling for required fields
  if (!promptText || !normalizedAddress || !txHash) {
    throw new Error("Missing required fields");
  }

  const { data, error } = await supabase
    .from("prompts")
    .insert({
      id: promptId.toString(),
      game_id: gameId.toString(),
      prompt_text: promptText,
      creator_address: normalizedAddress,
      is_agent_a: isAgentA,
      tx_hash: txHash,
      block_number: blockNumber.toString(),
      status: "pending",
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Database error:", error);
    throw error;
  }

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

import { useCallback, useEffect, useState } from "react";
import { getAddress, parseEther } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { createPrompt, getPrompts } from "~~/lib/prompts";
import type { PromptStatus } from "~~/lib/prompts";
import { supabase } from "~~/lib/supabaseClient";

interface DatabasePrompt {
  id: string;
  game_id: string;
  prompt_text: string;
  creator_address: string;
  is_agent_a: boolean;
  status: PromptStatus;
  votes: {
    amount: string;
    voter_address: string;
  }[];
}

const ensureUserInDatabase = async (address: string) => {
  try {
    const { data, error } = await supabase.from("users").select("address").eq("address", address).single();

    if (error) {
      if (error.code === "PGRST116") {
        // No entry found
        const { error: insertError } = await supabase.from("users").insert({ address });
        if (insertError) {
          throw new Error("Failed to add user to the database");
        }
      } else {
        throw new Error("Database error occurred while checking for user.");
      }
    } else {
      console.log("User exists in the database.");
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
};

export default function ProposalSection() {
  const { address } = useAccount(); // The address is provided by the wallet connection
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [prompts, setPrompts] = useState<DatabasePrompt[]>([]);
  const [promptText, setPromptText] = useState("");
  const [promptAmount, setPromptAmount] = useState("");

  // Fetch the current game ID using the smart contract
  const { data: currentGameId } = useScaffoldReadContract({
    contractName: "FuzzBetting",
    functionName: "currentGameId",
  });

  // Function to fetch prompts from the database
  const fetchPrompts = useCallback(async () => {
    if (!currentGameId) return;
    try {
      const data = await getPrompts(currentGameId);
      setPrompts(data);
    } catch (error) {
      console.error("Error fetching prompts:", error);
    }
  }, [currentGameId]);

  const { writeContractAsync: betWithPromptAsync } = useScaffoldWriteContract({
    contractName: "FuzzBetting",
  });

  // Effect to check if the user is in the database after wallet connection
  useEffect(() => {
    const checkUser = async () => {
      if (address) {
        await ensureUserInDatabase(address);
      }
    };
    checkUser();
  }, [address]); // Re-run when the wallet address is updated

  useEffect(() => {
    if (currentGameId) fetchPrompts();
  }, [currentGameId, fetchPrompts]);

  const handlePropose = async (isAgentA: boolean) => {
    try {
      if (!address) throw new Error("Wallet not connected");

      if (!promptText.trim()) {
        setError("Please enter a prompt");
        return;
      }

      if (!promptAmount || parseFloat(promptAmount) <= 0) {
        setError("Please enter a valid amount");
        return;
      }

      // Convert prompt amount to BigInt
      const amountInBigInt = BigInt(parseFloat(promptAmount) * 10 ** 18);

      // Await the transaction
      const transactionHash = await betWithPromptAsync({
        functionName: "betWithPrompt",
        args: [isAgentA, amountInBigInt],
      });

      if (!transactionHash) {
        throw new Error("Transaction failed: no transaction object returned.");
      }

      // Create a unique prompt ID
      const promptId = `${currentGameId * BigInt(100000) + BigInt(prompts.length + 1)}`;
      const promptData = {
        id: promptId,
        game_id: currentGameId.toString(),
        prompt_text: promptText.trim(),
        creator_address: address,
        is_agent_a: isAgentA,
        status: "confirmed" as PromptStatus,
      };

      // Store the prompt in the Supabase database
      await createPrompt(
        promptData.id,
        promptData.game_id,
        promptData.prompt_text,
        promptData.creator_address,
        promptData.is_agent_a,
        transactionHash,
        BigInt(0),
        promptData.status,
      );

      await fetchPrompts();
      setPromptText("");
      setPromptAmount("");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to submit prompt");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-base-100 rounded-xl">
      <h2 className="text-2xl font-bold">Propose a Prompt</h2>

      {/* Prompt Text Input */}
      <div className="form-control">
        <label className="label">
          <span className="label-text">Your Prompt</span>
        </label>
        <textarea
          placeholder="Enter your prompt for the AIs..."
          value={promptText}
          onChange={e => setPromptText(e.target.value)}
          className="textarea textarea-bordered h-24"
          disabled={isSubmitting}
        />
      </div>

      {/* Amount Input */}
      <div className="form-control">
        <label className="label">
          <span className="label-text">Bet Amount</span>
        </label>
        <input
          type="number"
          placeholder="Amount in tokens"
          value={promptAmount}
          onChange={e => setPromptAmount(e.target.value)}
          className="input input-bordered"
          disabled={isSubmitting}
          min="0"
          step="0.01"
        />
      </div>

      {/* Error Display */}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          className={`btn btn-primary ${isSubmitting ? "loading" : ""}`}
          disabled={isSubmitting}
          onClick={() => handlePropose(true)} // Propose for Agent A
        >
          {isSubmitting ? "Submitting..." : "Propose for Agent A"}
        </button>
        <button
          className={`btn btn-primary ${isSubmitting ? "loading" : ""}`}
          disabled={isSubmitting}
          onClick={() => handlePropose(false)} // Propose for Agent B
        >
          {isSubmitting ? "Submitting..." : "Propose for Agent B"}
        </button>
      </div>

      <div className="text-sm text-gray-500 text-right">{promptText.length}/500 characters</div>
      <div className="text-sm text-gray-500 mt-2">
        <p className="font-semibold">Guidelines:</p>
        <ul className="list-disc list-inside">
          <li>Be clear and specific in your prompt</li>
          <li>Avoid inappropriate or offensive content</li>
          <li>Minimum bet amount: 1 token</li>
        </ul>
      </div>
    </div>
  );
}

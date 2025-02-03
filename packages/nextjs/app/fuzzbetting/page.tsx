"use client";

// 1. Imports & Types
import { useCallback, useEffect, useState } from "react";
import { formatEther, parseEther } from "viem";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useDeployedContractInfo, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useAuth } from "~~/lib/auth";
import { createPrompt, getPrompts } from "~~/lib/prompts";
import { supabase } from "~~/lib/supabaseClient";

// Types
type PromptStatus = "pending" | "completed" | "failed";

// interface BlockchainPrompt {
//   id?: bigint;
//   gameId?: bigint;
//   creator: string;
//   isAgentA: boolean;
//   votes: bigint;
//   exists: boolean;
// }

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

interface CombinedPrompt {
  id: string;
  gameId: string;
  creator: string;
  isAgentA: boolean;
  votes: bigint;
  promptText: string;
  status: PromptStatus;
  totalVotes: string;
}
const ErrorDisplay = ({ error, onDismiss }: { error: string; onDismiss: () => void }) => (
  <div className="alert alert-error">
    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
    <span>{error}</span>
    <button className="btn btn-sm" onClick={onDismiss}>
      Dismiss
    </button>
  </div>
);
// 2. ApprovalCheck Component
const ApprovalCheck = () => {
  const { address } = useAccount();
  const [hasApproval, setHasApproval] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Get the FuzzBetting contract address
  const { data: fuzzBettingContract } = useDeployedContractInfo({
    contractName: "FuzzBetting",
  });

  // Read allowance using useScaffoldReadContract
  const { data: allowance } = useScaffoldReadContract({
    contractName: "Token",
    functionName: "allowance",
    args: [
      (address ?? undefined) as string | undefined,
      (fuzzBettingContract?.address ?? undefined) as string | undefined,
    ],
  });

  // Write approve using useScaffoldWriteContract
  const { writeContractAsync: approveToken } = useScaffoldWriteContract({
    contractName: "Token",
  });

  const handleApprove = async () => {
    if (!fuzzBettingContract?.address) return;

    try {
      setIsChecking(true);
      await approveToken({
        functionName: "approve",
        args: [fuzzBettingContract.address as `0x${string}`, parseEther("1000")],
      });
    } catch (error) {
      console.error("Error approving:", error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (allowance !== undefined) {
      setHasApproval(allowance > 0n);
      setIsChecking(false);
    }
  }, [allowance]);

  if (isChecking) return <div>Checking approval...</div>;

  if (!hasApproval) {
    return (
      <div className="alert alert-warning">
        <div>
          <span>Token approval required to interact with FuzzBetting</span>
          <button className="btn btn-primary" onClick={handleApprove}>
            Approve Tokens
          </button>
        </div>
      </div>
    );
  }

  return null;
};
//////// DEBUG
const DebugSection = () => {
  const { address } = useAccount();
  const { signIn, user } = useAuth();
  const [debugStatus, setDebugStatus] = useState<string>("");

  const verifyUserExists = async (userAddress: string) => {
    try {
      if (!userAddress) {
        throw new Error("No address provided");
      }
      const normalizedAddress = userAddress.toLowerCase();
      console.log("Checking for address:", normalizedAddress);

      const { data, error } = await supabase.from("users").select("*").eq("address", normalizedAddress).single();

      if (error) {
        console.error("Error verifying user:", error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error("Error in verifyUserExists:", error);
      return false;
    }
  };

  const runTests = async () => {
    try {
      setDebugStatus("Starting debug process...");

      if (!address) {
        throw new Error("No wallet connected");
      }

      console.log("Starting debug process with address:", address.toLowerCase());

      // 1. Sign in / Create user
      setDebugStatus("Signing in...");
      const userData = await signIn();
      console.log("Sign in completed, user data:", userData);

      if (!userData?.address) {
        throw new Error("Sign in failed - no address returned");
      }

      // 2. Verify user exists
      setDebugStatus("Verifying user...");
      const userExists = await verifyUserExists(userData.address);
      console.log("User exists check:", userExists);

      if (!userExists) {
        throw new Error("User not properly created");
      }

      // 3. Test Prompt Creation
      setDebugStatus("Creating test prompt...");
      const promptId = BigInt(Date.now());
      const testPrompt = await createPrompt(
        promptId,
        BigInt(1),
        "Test prompt",
        userData.address,
        true,
        "0x" + Date.now().toString(16),
        BigInt(1),
      );
      console.log("Prompt created:", testPrompt);

      setDebugStatus("Debug process completed successfully!");
    } catch (error) {
      console.error("Debug error:", error);
      setDebugStatus(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-base-100 rounded-xl">
      <h2 className="text-2xl font-bold">Debug</h2>
      <div className="mt-2 text-sm space-y-1">
        <p>Connected Wallet: {address || "Not connected"}</p>
        <p>User Status: {user ? `Signed In as ${user.address}` : "Not Signed In"}</p>
        {debugStatus && <p className="text-info">Status: {debugStatus}</p>}
      </div>
      <button className="btn btn-warning" onClick={runTests} disabled={!address}>
        Run Debug Tests
      </button>
    </div>
  );
};
//////////////

// 3. Main FuzzBetting Component
export default function FuzzBetting() {
  // State & Hooks
  const { address } = useAccount();
  const { user } = useAuth();
  const [promptText, setPromptText] = useState(""); // Changed from boolean to string
  const [promptAmount, setPromptAmount] = useState("");
  const [betAmount, setBetAmount] = useState("");
  const [voteAmount, setVoteAmount] = useState("");
  const [selectedPromptId, setSelectedPromptId] = useState("");
  const [prompts, setPrompts] = useState<DatabasePrompt[]>([]); // Added type
  const [combinedPrompts, setCombinedPrompts] = useState<CombinedPrompt[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<{
    betting: boolean;
    voting: boolean;
    proposing: boolean;
  }>({
    betting: false,
    voting: false,
    proposing: false,
  });

  // Contract Read Hooks
  const { data: totalAgentA } = useScaffoldReadContract({
    contractName: "FuzzBetting",
    functionName: "totalAgentA",
  });

  const { data: totalAgentB } = useScaffoldReadContract({
    contractName: "FuzzBetting",
    functionName: "totalAgentB",
  });

  const { data: currentGameId } = useScaffoldReadContract({
    contractName: "FuzzBetting",
    functionName: "currentGameId",
  });

  const { data: currentPrompts } = useScaffoldReadContract({
    contractName: "FuzzBetting",
    functionName: "getCurrentGamePrompts",
  });

  // Contract Write Hooks
  const { writeContractAsync: betWithPromptAsync } = useScaffoldWriteContract({
    contractName: "FuzzBetting",
  });

  const { writeContractAsync: betOnAgentAsync } = useScaffoldWriteContract({
    contractName: "FuzzBetting",
  });

  const { writeContractAsync: voteForPromptAsync } = useScaffoldWriteContract({
    contractName: "FuzzBetting",
  });

  // Handlers and Effects
  const fetchPrompts = useCallback(async () => {
    try {
      if (!currentGameId) return;
      const data = await getPrompts(currentGameId);
      setPrompts(data);
    } catch (error) {
      console.error("Error fetching prompts:", error);
    }
  }, [currentGameId]);

  useEffect(() => {
    if (currentGameId) {
      fetchPrompts();
    }
  }, [currentGameId, fetchPrompts]);
  useEffect(() => {
    const mergePrompts = async () => {
      setIsLoadingPrompts(true);
      try {
        await mergeBchainAndDbPrompts();
      } catch (error) {
        console.error("Error merging prompts:", error);
      } finally {
        setIsLoadingPrompts(false);
      }
    };

    if (currentGameId && currentPrompts) {
      console.log("Triggering merge with:", {
        currentGameId: currentGameId.toString(),
        currentPrompts,
      });
      mergePrompts();
    }
  }, [currentGameId, currentPrompts]);

  const handleBetWithPrompt = async (isAgentA: boolean, promptText: string) => {
    try {
      if (!address) throw new Error("No wallet connected");
      if (!currentGameId) throw new Error("No active game");
      if (!promptText.trim()) throw new Error("Prompt text is required");
      if (!promptAmount || parseFloat(promptAmount) <= 0) {
        throw new Error("Invalid bet amount");
      }

      setIsProcessing(prev => ({ ...prev, proposing: true }));

      // Create transaction
      const hash = await betWithPromptAsync({
        functionName: "betWithPrompt",
        args: [isAgentA, parseEther(promptAmount)],
      });

      console.log("Transaction hash:", hash);

      if (!hash) throw new Error("Transaction failed");

      // Create prompt in database using transaction hash
      await createPrompt(
        BigInt(hash), // Using hash as ID
        currentGameId,
        promptText.trim(),
        address,
        isAgentA,
        hash.toString(),
        BigInt(0), // We'll update this later if needed
      );

      // Refresh prompts
      await fetchPrompts();
      await mergeBchainAndDbPrompts();

      // Reset form
      setPromptText("");
      setPromptAmount("");

      // Show success message if needed
      console.log("Prompt created successfully!");
    } catch (error) {
      console.error("Error creating prompt:", error);
      setError(error instanceof Error ? error.message : "Failed to create prompt");
    } finally {
      setIsProcessing(prev => ({ ...prev, proposing: false }));
    }
  };

  const handleBetOnAgent = async (isAgentA: boolean) => {
    try {
      await betOnAgentAsync({
        functionName: "betOnAgent",
        args: [isAgentA, parseEther(betAmount || "0")],
      });
    } catch (error) {
      console.error("Error betting on agent:", error);
    }
  };

  const handleVoteForPrompt = async () => {
    try {
      await voteForPromptAsync({
        functionName: "voteForPrompt",
        args: [BigInt(selectedPromptId), parseEther(voteAmount || "0")],
      });
    } catch (error) {
      console.error("Error voting for prompt:", error);
    }
  };

  // Call merge function
  const mergeBchainAndDbPrompts = async () => {
    if (!currentGameId || !currentPrompts) {
      console.log("Missing data for merge:", { currentGameId, currentPrompts });
      return;
    }

    try {
      setIsLoadingPrompts(true);

      // Log the raw blockchain prompts for debugging
      console.log("Raw blockchain prompts:", currentPrompts);

      // Get Supabase prompts with relationships
      const dbPrompts = await getPrompts(currentGameId);
      console.log("Database prompts:", dbPrompts);

      // Type assert and transform blockchain prompts
      const bchainPrompts = (currentPrompts as any[]).map((bp: any) => ({
        id: bp.id?.toString() || "unknown",
        gameId: bp.gameId?.toString() || currentGameId.toString(),
        creator: bp.creator || "unknown",
        isAgentA: !!bp.isAgentA,
        votes: BigInt(bp.votes?.toString() || "0"),
        exists: !!bp.exists,
      }));

      console.log("Transformed blockchain prompts:", bchainPrompts);

      const merged: CombinedPrompt[] = bchainPrompts
        .filter(bp => bp.exists)
        .map(bchainPrompt => {
          const dbPrompt = dbPrompts.find(p => p.id === bchainPrompt.id);
          console.log("Matching prompt:", { bchainPrompt, dbPrompt });

          // Calculate total votes from database if available
          const totalVotes = dbPrompt?.votes
            ? dbPrompt.votes
                .reduce((sum: number, vote: { amount: string }) => {
                  return sum + parseFloat(vote.amount);
                }, 0)
                .toString()
            : "0";

          return {
            id: bchainPrompt.id,
            gameId: bchainPrompt.gameId,
            creator: bchainPrompt.creator,
            isAgentA: bchainPrompt.isAgentA,
            votes: bchainPrompt.votes,
            promptText: dbPrompt?.prompt_text || "Loading...",
            status: (dbPrompt?.status as PromptStatus) || "pending",
            totalVotes,
          };
        });

      console.log("Merged prompts:", merged);
      setCombinedPrompts(merged);
    } catch (error) {
      console.error("Error merging prompts:", error);
      setError(error instanceof Error ? error.message : "Error merging prompts");
    } finally {
      setIsLoadingPrompts(false);
    }
  };

  // UI Components
  const ProposalSection = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handlePropose = async (isAgentA: boolean) => {
      if (!promptText.trim()) {
        setError("Please enter a prompt");
        return;
      }

      if (!promptAmount || parseFloat(promptAmount) <= 0) {
        setError("Please enter a valid amount");
        return;
      }

      setError("");
      setIsSubmitting(true);

      try {
        await handleBetWithPrompt(isAgentA, promptText.trim());
        setPromptText("");
      } catch (err) {
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
        {error && (
          <div className="alert alert-error">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            className={`btn btn-primary ${isProcessing.proposing ? "loading" : ""}`}
            disabled={isProcessing.proposing}
            onClick={() => handlePropose(true)}
          >
            {isProcessing.proposing ? "Submitting..." : "Propose for Agent A"}
          </button>
          <button
            className={`btn btn-primary ${isProcessing.proposing ? "loading" : ""}`}
            disabled={isProcessing.proposing}
            onClick={() => handlePropose(false)}
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
  };

  const BettingSection = () => (
    <div className="flex flex-col gap-3 p-4 bg-base-100 rounded-xl">
      <h2 className="text-2xl font-bold">Simple Betting</h2>
      <input
        type="number"
        placeholder="Amount in tokens"
        value={betAmount}
        onChange={e => setBetAmount(e.target.value)}
        className="input input-bordered"
      />
      <div className="flex gap-2">
        <button className="btn btn-primary" onClick={() => handleBetOnAgent(true)}>
          Bet on Agent A
        </button>
        <button className="btn btn-secondary" onClick={() => handleBetOnAgent(false)}>
          Bet on Agent B
        </button>
      </div>
    </div>
  );

  const VotingSection = () => (
    <div className="flex flex-col gap-3 p-4 bg-base-100 rounded-xl">
      <h2 className="text-2xl font-bold">Vote for Prompt</h2>
      <input
        type="number"
        placeholder="Prompt ID"
        value={selectedPromptId}
        onChange={e => setSelectedPromptId(e.target.value)}
        className="input input-bordered"
      />
      <input
        type="number"
        placeholder="Amount in tokens"
        value={voteAmount}
        onChange={e => setVoteAmount(e.target.value)}
        className="input input-bordered"
      />
      <button className="btn btn-primary" onClick={handleVoteForPrompt}>
        Vote
      </button>
    </div>
  );

  const StatsSection = () => (
    <div className="flex flex-col gap-3 p-4 bg-base-100 rounded-xl">
      <h2 className="text-2xl font-bold">Current Game Stats</h2>
      <div className="stats shadow">
        <div className="stat">
          <div className="stat-title">Total for Agent A</div>
          <div className="stat-value">{totalAgentA ? formatEther(totalAgentA) : "0"}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Total for Agent B</div>
          <div className="stat-value">{totalAgentB ? formatEther(totalAgentB) : "0"}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Game ID</div>
          <div className="stat-value">{currentGameId?.toString()}</div>
        </div>
      </div>
    </div>
  );

  const PromptsListSection = () => {
    if (isLoadingPrompts) {
      return <div className="text-center py-4">Loading prompts...</div>;
    }

    if (error) {
      return <div className="text-center py-4 text-error">{error}</div>;
    }
    return (
      <div className="flex flex-col gap-3 p-4 bg-base-100 rounded-xl">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Current Game Prompts</h2>
          <button className="btn btn-ghost btn-sm" onClick={mergeBchainAndDbPrompts} disabled={isLoadingPrompts}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                clipRule="evenodd"
              />
            </svg>
            Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Creator</th>
                <th>Prompt</th>
                <th>Agent</th>
                <th>Votes</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {combinedPrompts.map(prompt => (
                <tr key={prompt.id}>
                  <td>{prompt.id}</td>
                  <td>
                    <Address address={prompt.creator} />
                  </td>
                  <td>{prompt.promptText}</td>
                  <td>{prompt.isAgentA ? "Agent A" : "Agent B"}</td>
                  <td>{formatEther(prompt.votes)}</td>
                  <td>
                    <span
                      className={`badge badge-${
                        prompt.status === "pending" ? "warning" : prompt.status === "completed" ? "success" : "error"
                      }`}
                    >
                      {prompt.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {combinedPrompts.length === 0 && (
            <div className="text-center py-4 text-gray-500">No prompts found for current game</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {error && <ErrorDisplay error={error} onDismiss={() => setError(null)} />}
      <ApprovalCheck />
      <StatsSection />
      <DebugSection />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ProposalSection />
        <BettingSection />
        <VotingSection />
      </div>
      <PromptsListSection />
    </div>
  );
}

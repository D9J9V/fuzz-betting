import { useEffect, useState } from "react";
import { Address } from "../scaffold-eth";
import { formatEther } from "viem";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { getPrompts } from "~~/lib/prompts";
import type { PromptStatus } from "~~/lib/prompts";

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

export default function PromptsListSection() {
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);
  const [combinedPrompts, setCombinedPrompts] = useState<CombinedPrompt[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { data: currentGameId } = useScaffoldReadContract({
    contractName: "FuzzBetting",
    functionName: "currentGameId",
  });

  const { data: currentPrompts } = useScaffoldReadContract({
    contractName: "FuzzBetting",
    functionName: "getCurrentGamePrompts",
  });

  const mergeBchainAndDbPrompts = async () => {
    if (!currentGameId || !currentPrompts) return;

    try {
      setError(null);
      setIsLoadingPrompts(true);

      // Extract blockchain prompts and ensure unique IDs
      const bchainPrompts = (currentPrompts as any[])
        .filter(bp => bp.exists)
        .map((bp: any, index) => ({
          id: (currentGameId * BigInt(100000) + BigInt(index + 1)).toString(),
          gameId: currentGameId.toString(),
          creator: bp.creator,
          isAgentA: !!bp.isAgentA,
          votes: BigInt(bp.votes?.toString() || "0"),
          promptText: `Prompt #${(currentGameId * BigInt(100000) + BigInt(index + 1)).toString()}`,
        }));

      // Fetch prompts from the database
      const dbPrompts = await getPrompts(currentGameId);
      console.log("Database prompts:", dbPrompts);

      // Merging logic: ensure that we're matching based on prompt ID
      const merged: CombinedPrompt[] = bchainPrompts.map(bchainPrompt => {
        const dbPrompt = dbPrompts.find(p => p.id === bchainPrompt.id);

        // Default values
        let promptText = "Not available";
        let status: PromptStatus = "pending";

        // Update prompt text and status based on existence in the database
        if (dbPrompt) {
          promptText = dbPrompt.prompt_text;
          status = (dbPrompt.status as PromptStatus) || "confirmed";
        }

        return {
          id: bchainPrompt.id,
          gameId: bchainPrompt.gameId,
          creator: bchainPrompt.creator,
          isAgentA: bchainPrompt.isAgentA,
          votes: bchainPrompt.votes,
          promptText,
          status,
          totalVotes: formatEther(Number(bchainPrompt.votes)),
        };
      });

      setCombinedPrompts(merged);
    } catch (error) {
      console.error("Error in mergeBchainAndDbPrompts:", error);
      setError("Error fetching prompts.");
    } finally {
      setIsLoadingPrompts(false);
    }
  };

  useEffect(() => {
    mergeBchainAndDbPrompts();
  }, [currentGameId, currentPrompts]);

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
                    className={`badge badge-${prompt.status === "pending" ? "warning" : prompt.status === "completed" ? "success" : "error"}`}
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
}

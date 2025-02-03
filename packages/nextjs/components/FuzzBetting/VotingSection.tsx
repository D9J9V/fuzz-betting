import { useState } from "react";
import { parseEther } from "viem";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export default function VotingSection() {
  const [selectedPromptId, setSelectedPromptId] = useState("");
  const [voteAmount, setVoteAmount] = useState("");

  const { writeContractAsync: voteForPromptAsync } = useScaffoldWriteContract({
    contractName: "FuzzBetting",
  });

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

  return (
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
}

"use client";

import { useEffect, useState } from "react";
import { formatEther, parseEther } from "viem";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export default function FuzzBetting() {
  const { address } = useAccount();
  const [promptAmount, setPromptAmount] = useState("");
  const [betAmount, setBetAmount] = useState("");
  const [voteAmount, setVoteAmount] = useState("");
  const [selectedPromptId, setSelectedPromptId] = useState("");

  // Read Contract States
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

  // Write Contract Functions
  const { writeContractAsync: betWithPromptAsync } = useScaffoldWriteContract({
    contractName: "FuzzBetting",
  });

  const { writeContractAsync: betOnAgentAsync } = useScaffoldWriteContract({
    contractName: "FuzzBetting",
  });

  const { writeContractAsync: voteForPromptAsync } = useScaffoldWriteContract({
    contractName: "FuzzBetting",
  });

  // Handler Functions
  const handleBetWithPrompt = async (isAgentA: boolean) => {
    try {
      await betWithPromptAsync({
        functionName: "betWithPrompt",
        args: [isAgentA, parseEther(promptAmount || "0")],
      });
    } catch (error) {
      console.error("Error betting with prompt:", error);
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

  // UI Sections
  const ProposalSection = () => (
    <div className="flex flex-col gap-3 p-4 bg-base-100 rounded-xl">
      <h2 className="text-2xl font-bold">Propose a Prompt</h2>
      <input
        type="number"
        placeholder="Amount in tokens"
        value={promptAmount}
        onChange={e => setPromptAmount(e.target.value)}
        className="input input-bordered"
      />
      <div className="flex gap-2">
        <button className="btn btn-primary" onClick={() => handleBetWithPrompt(true)}>
          Propose for Agent A
        </button>
        <button className="btn btn-secondary" onClick={() => handleBetWithPrompt(false)}>
          Propose for Agent B
        </button>
      </div>
    </div>
  );

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

  const PromptsListSection = () => (
    <div className="flex flex-col gap-3 p-4 bg-base-100 rounded-xl">
      <h2 className="text-2xl font-bold">Current Game Prompts</h2>
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Creator</th>
              <th>Agent</th>
              <th>Votes</th>
            </tr>
          </thead>
          <tbody>
            {currentPrompts?.map((prompt: any, index: number) => (
              <tr key={index}>
                <td>{prompt.gameId.toString()}</td>
                <td>
                  <Address address={prompt.creator} />
                </td>
                <td>{prompt.isAgentA ? "Agent A" : "Agent B"}</td>
                <td>{formatEther(prompt.votes)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 p-4">
      <StatsSection />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ProposalSection />
        <BettingSection />
        <VotingSection />
      </div>
      <PromptsListSection />
    </div>
  );
}

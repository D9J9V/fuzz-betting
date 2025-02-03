import { useState } from "react";
import { parseEther } from "viem";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export default function BettingSection() {
  const [betAmount, setBetAmount] = useState("");
  const { writeContractAsync: betOnAgentAsync } = useScaffoldWriteContract({
    contractName: "FuzzBetting",
  });

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
  return (
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
}

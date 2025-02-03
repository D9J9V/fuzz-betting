import { formatEther } from "viem";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

export default function StatsSection() {
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

  return (
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
}

import { useEffect, useState } from "react";
import { parseEther } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";

export default function ApprovalCheck() {
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
}

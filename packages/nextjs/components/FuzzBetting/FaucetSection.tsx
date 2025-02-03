import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export default function FaucetSection() {
  const { address } = useAccount(); // Retrieve the connected wallet address

  // Reading the token balance
  const { data: tokenBalance } = useScaffoldReadContract({
    contractName: "Token",
    functionName: "balanceOf",
    args: [address], // Address of the connected wallet
    watch: true, // Keep this value updated
  });

  const { writeContractAsync: mintTokens } = useScaffoldWriteContract({
    contractName: "Token",
  });

  const handleMint = async () => {
    try {
      await mintTokens({
        functionName: "mint", // Call the mint function in the Token contract
      });
    } catch (error) {
      console.error("Minting error:", error);
    }
  };

  // Function to format token balance based on decimals
  const formatTokenBalance = (balance: bigint | undefined) => {
    if (!balance) return "Loading...";
    const decimalPlaces = 18; // Adjust this based on your token's actual decimal configuration
    return (Number(balance) / 10 ** decimalPlaces).toFixed(2); // Format to 2 decimal places
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-base-100 rounded-xl">
      <h2 className="text-2xl font-bold">MyToken Faucet</h2>
      <p>Mint tokens to play the game!</p>
      <p className="text-lg">Current Balance: {formatTokenBalance(tokenBalance)} MyToken</p>
      <button className="btn btn-primary" onClick={handleMint}>
        Mint Tokens
      </button>
    </div>
  );
}

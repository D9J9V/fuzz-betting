import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys the FuzzBetting contract with specified token and agent addresses
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployFuzzBetting: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Configuration parameters
  const TOKEN_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const AGENT_A = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
  const AGENT_B = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";

  await deploy("FuzzBetting", {
    from: deployer,
    args: [TOKEN_ADDRESS, AGENT_A, AGENT_B],
    log: true,
    autoMine: true,
  });

  // Get the deployed contract
  const fuzzBetting = await hre.ethers.getContract<Contract>("FuzzBetting", deployer);

  // Log initial contract state
  const token = await fuzzBetting.token();
  const agentA = await fuzzBetting.agentA();
  const agentB = await fuzzBetting.agentB();
  const currentGameId = await fuzzBetting.currentGameId();
  const minBetAmount = await fuzzBetting.minBetAmount();
  const owner = await fuzzBetting.owner();

  console.log("📊 FuzzBetting Deployment Info:");
  console.log("- Token Address:", token);
  console.log("- Agent A:", agentA);
  console.log("- Agent B:", agentB);
  console.log("- Current Game ID:", currentGameId);
  console.log("- Minimum Bet Amount:", minBetAmount);
  console.log("- Contract Owner:", owner);
};

export default deployFuzzBetting;

// Tags for selective deployment
deployFuzzBetting.tags = ["FuzzBetting"];

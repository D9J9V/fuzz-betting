import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys the Token (ERC20) contract using the deployer account as the initial owner
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployToken: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("Token", {
    from: deployer,
    // Contract constructor arguments - passing deployer as initialOwner
    args: [deployer],
    log: true,
    autoMine: true,
  });

  // Get the deployed contract
  const tokenContract = await hre.ethers.getContract<Contract>("Token", deployer);

  // Log some initial information about the token
  const name = await tokenContract.name();
  const symbol = await tokenContract.symbol();
  const decimals = await tokenContract.decimals();
  const owner = await tokenContract.owner();

  console.log("�Token Deployment Info:");
  console.log("- Name:", name);
  console.log("- Symbol:", symbol);
  console.log("- Decimals:", decimals);
  console.log("- Owner:", owner);
};

export default deployToken;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags Token
deployToken.tags = ["Token"];

import { ethers } from "hardhat"

async function main() {

	const [deployer] = await ethers.getSigners();

	console.log(
	"Deploying contracts with the account:",
	deployer.address
	);
	const multicall = await ethers.getContractFactory("MultiCall");
	const MulticallContract = await multicall.deploy();

	console.log("Contract deployed at:", MulticallContract.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
	console.error(error);
	process.exit(1);
  })
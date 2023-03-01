import { TestRenBridge } from "../typechain-types";
import { ethers } from "hardhat";
import { IERC20 } from "../typechain-types";

async function main() {
  let [deployer] = await ethers.getSigners();
  const TokenAContractFactory = (await ethers.getContractAt(
    "TestRenBridge",
    "0xe3Af7dde1F89515a3E114F228757b5213ec86Dd2"
  )) as TestRenBridge;

  const tokenContract = (await ethers.getContractAt(
    "IERC20",
    "0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844"
  )) as IERC20;

  const approvalTx = await tokenContract
    .connect(deployer)
    .approve(TokenAContractFactory.address, "80000000000000000000");
  const approvalReceipt = await approvalTx.wait(1);
  console.log(approvalReceipt);

  const depositTx = await TokenAContractFactory.connect(deployer).transferFrom(
    "80000000000000000000",
    "0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844"
  );
  const depositReceipt = await depositTx.wait(1);
  console.log(depositReceipt);

  const userBalance = await TokenAContractFactory.getContractTokenbalance(
    "0x270203070650134837F3C33Fa7D97DC456eF624e",
    ""
  );
  console.log(userBalance);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

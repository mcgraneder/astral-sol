import { TestRenBridge } from "../typechain-types";
import { ethers } from "hardhat";
import { IERC20 } from "../typechain-types";

async function main() {
  let [deployer] = await ethers.getSigners();
  const TokenAContractFactory = (await ethers.getContractAt(
    "TestRenBridge",
    "0x2eB3BFaadDe245450e29a7307897051d457234FC"
  )) as TestRenBridge;

  const tokenContract = (await ethers.getContractAt(
    "IERC20",
    "0xF0dbeB58522b96cdCdB790BCaD9Fd8Da7D7fa35c"
  )) as IERC20;

  // const approvalTx = await tokenContract
  //   .connect(deployer)
  //   .approve(TokenAContractFactory.address, "80000000000000000000");

  // const approvalReceipt = await approvalTx.wait(1);
  // console.log(approvalReceipt);

  const depositTx = await TokenAContractFactory.connect(deployer).transferFrom(
    857970,
    tokenContract.address
  );
  const depositReceipt = await depositTx.wait(1);
  console.log(depositReceipt);

  const userBalance = await TokenAContractFactory.getContractTokenbalance(
    tokenContract.address,
    tokenContract.address
  );
  console.log(userBalance);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

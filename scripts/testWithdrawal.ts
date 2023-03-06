import { TestRenBridge } from "../typechain-types";
import { ethers } from "hardhat";
import { IERC20 } from "../typechain-types";

async function main() {
  let [deployer] = await ethers.getSigners();
  console.log(deployer.address)
  const TokenAContractFactory = (await ethers.getContractAt(
    "TestRenBridge",
    "0x2eB3BFaadDe245450e29a7307897051d457234FC"
  )) as TestRenBridge;

      const tokenContract = (await ethers.getContractAt(
        "IERC20",
        "0xF0dbeB58522b96cdCdB790BCaD9Fd8Da7D7fa35c"
      )) as IERC20;
    
      const userBalancea = await tokenContract.balanceOf(deployer.address);
      console.log(Number(userBalancea));

  const withdrawlTx = await TokenAContractFactory.connect(deployer).transfer(
    deployer.address,
    10,
    tokenContract.address
  );
  const withdrawalReceipt = await withdrawlTx.wait(1);
  console.log(withdrawalReceipt);

  const userBalance = await tokenContract.balanceOf(
    deployer.address
  );
  console.log(userBalance);
  console.log(Number(userBalance));

}

const SA = ["BTC", "USDT_Goerli", "DAI_Goerli"]
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

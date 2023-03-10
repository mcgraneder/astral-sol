import { RenBridge } from "../typechain-types";
import { ethers } from "hardhat";
import { IERC20 } from "../typechain-types";

async function main() {
    let [deployer] = await ethers.getSigners();
    const TokenAContractFactory = (await ethers.getContractAt(
      "RenBridge",
      "0x9dFFd9DA32975f0955e3EfB62669aC167376d8AA"
    )) as RenBridge;
    const tokenContract = await ethers.getContractAt("IERC20", "0x880Ad65DC5B3F33123382416351Eef98B4aAd7F1") as IERC20;
    
    const approvalTx = await tokenContract.connect(deployer).approve(TokenAContractFactory.address, 1000)
    const approvalReceipt = await approvalTx.wait(1)
    console.log(approvalReceipt)

    const depositTx = await TokenAContractFactory.connect(deployer).transferFrom(1000, "0x880Ad65DC5B3F33123382416351Eef98B4aAd7F1")
    const depositReceipt = await depositTx.wait(1)
    console.log(depositReceipt)

    const userBalance = await TokenAContractFactory.getUserbalanceInContract("0x880Ad65DC5B3F33123382416351Eef98B4aAd7F1", deployer.address)
    console.log(userBalance)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
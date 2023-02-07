import { RenBridge } from "../typechain-types";
import { ethers } from "hardhat";

async function main() {
    let [deployer] = await ethers.getSigners();
    const TokenAContractFactory = await ethers.getContractAt("RenBridge", "0x473807BBB0A2cc0c06dC7602571bBa42bFacFb78") as RenBridge;

    const x = await TokenAContractFactory.connect(deployer).addToken("BTC", "0x880Ad65DC5B3F33123382416351Eef98B4aAd7F1");
    const receipt = await x.wait(1)
    console.log(receipt)
    const tokenList = await TokenAContractFactory.getTokenList()
    console.log(tokenList)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
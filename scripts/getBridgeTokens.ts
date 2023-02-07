import { RenBridge } from "../typechain-types";
import { ethers } from "hardhat";

async function main() {
    let [deployer] = await ethers.getSigners();
    const TokenAContractFactory = await ethers.getContractAt("RenBridge", "0x986e0d0F68292394A73aC9553428fEB54E23962F") as RenBridge;
    const tokenList = await TokenAContractFactory.getTokenList()
    console.log(tokenList)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
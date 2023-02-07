import { RenBridge } from "../typechain-types";
import { ethers } from "hardhat";

async function main() {
    const TokenAContractFactory = await ethers.getContractAt("RenBridge", "0x47bd0705a3B7369C2F27C424911056277069dba7") as RenBridge;

    let swapperUSDCBalance = await TokenAContractFactory.getUserTokenBalance("USDT", "0x13480Ea818fE2F27b82DfE7DCAc3Fd3E63A94113");
    console.log("Swapper USDC, WETH balance before conditional call", swapperUSDCBalance);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
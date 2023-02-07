import { ethers } from "hardhat";
import { Chain } from "@renproject/utils";
import { Asset } from "@renproject/chains"
import { RenBridge } from "../typechain-types";
import { RenBridge__factory } from "../typechain-types";

export const supportedAssets =
 [
              "BTC",
              "BCH",
              "DGB",
              "DOGE",
              "FIL",
              "LUNA",
              "ZEC",
              "ETH",
              "BNB",
              "AVAX",
              "FTM",
              "ArbETH",
              "MATIC",
              "GLMR",
              "KAVA",
              "USDC_Goerli",
              "USDT_Goerli",
              "USDC_Goerli",
              "DAI_Goerli"
]     
        
async function main() {
  const registry = "0x5076a1F237531fa4dC8ad99bb68024aB6e1Ff701"

  const Bridge = await ethers.getContractFactory("RenBridge") as RenBridge__factory;
  const bridge = await Bridge.deploy(registry) as RenBridge;

  await bridge.deployed();

  const tokenList = await bridge.getTokenList()
  console.log(tokenList)

  console.log(`contract deployed to ${bridge.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

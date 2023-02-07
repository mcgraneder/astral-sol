import { ethers } from "hardhat";
import { Chain } from "@renproject/utils";
import { Asset } from "@renproject/chains"
import { RenBridge } from "../typechain-types";
import { RenBridge__factory } from "../typechain-types";
import { IGatewayRegistry } from "../typechain-types";
  
type AssetInfo = {
  tokenAddress: string;
  mintGatewayAddress: string
}

async function main() {
  let [deployer] = await ethers.getSigners();
  const registry = "0x5076a1F237531fa4dC8ad99bb68024aB6e1Ff701"

  const renAssetMapping= {} as { [symbol: string]: AssetInfo } 

  //setp1 getMintGateway symbols
  const gatewayRegistry = await ethers.getContractAt("IGatewayRegistry", registry) as IGatewayRegistry
  const mintGatewaySymbols = await gatewayRegistry.getMintGatewaySymbols(0, 0)

  console.log(mintGatewaySymbols)
  for (let symbol = 0; symbol < mintGatewaySymbols.length; symbol++) {
    const mintGatewayAddress = await gatewayRegistry.getMintGatewayBySymbol(mintGatewaySymbols[symbol]);
    const assetAddress = await gatewayRegistry.getRenAssetBySymbol(mintGatewaySymbols[symbol])

    const renAsset: AssetInfo = {
      tokenAddress: assetAddress,
      mintGatewayAddress: mintGatewayAddress
    }
    renAssetMapping[mintGatewaySymbols[symbol]] = renAsset
  }

  //2 deploy bridge
  const Bridge = await ethers.getContractFactory("RenBridge") as RenBridge__factory;
  const bridge = await Bridge.connect(deployer).deploy(registry) as RenBridge;
  await bridge.deployed();

  //3 for each asset add the token
  for (let symbol = 0; symbol < mintGatewaySymbols.length; symbol++) {
    const addToken = await bridge.connect(deployer).addToken(
      mintGatewaySymbols[symbol], 
      renAssetMapping[mintGatewaySymbols[symbol]].tokenAddress
    )
    const receipt = await addToken.wait(1);
    console.log(receipt)
  }

  //pront tokenList
  const tokenList = await bridge.getTokenList()
  console.log(`contract deployed to ${bridge.address}`);
  console.log(`with supported token array ${tokenList}`);

  
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

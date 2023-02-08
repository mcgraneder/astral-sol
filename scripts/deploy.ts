import { ethers } from "hardhat";
import { RenBridge } from "../typechain-types";
import { RenBridge__factory } from "../typechain-types";
import { IGatewayRegistry } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

let Bridge: RenBridge__factory;
let bridge: RenBridge;

type AssetInfo = {
  tokenAddress: string;
  mintGatewayAddress: string;
};

interface IAddToConstructor {
  mintGatwayAddresses: string[];
  assetAddresses: string[];
  mintGatewaySymbols: string[];
}
const addTokensInConstructor = async (
  registry: string
): Promise<IAddToConstructor> => {
  //setp1 getMintGateway symbols
  const gatewayRegistry = (await ethers.getContractAt(
    "IGatewayRegistry",
    registry
  )) as IGatewayRegistry;
  const mintGatewaySymbols = await gatewayRegistry.getMintGatewaySymbols(0, 0);

  let mintGatwayAddresses: string[] = [];
  let assetAddresses: string[] = [];
  for (let symbol = 0; symbol < mintGatewaySymbols.length; symbol++) {
    const mintGatewayAddress = await gatewayRegistry.getMintGatewayBySymbol(
      mintGatewaySymbols[symbol]
    );
    mintGatwayAddresses.push(mintGatewayAddress);

    const asset = await gatewayRegistry.getRenAssetBySymbol(
      mintGatewaySymbols[symbol]
    );
    assetAddresses.push(asset);
  }
  return { mintGatwayAddresses, assetAddresses, mintGatewaySymbols };
};

const addTokensAdterDeployment = async (
  registry: string,
  bridge: RenBridge,
  deployer: SignerWithAddress
): Promise<void> => {
  const renAssetMapping = {} as { [symbol: string]: AssetInfo };
  const gatewayRegistry = (await ethers.getContractAt(
    "IGatewayRegistry",
    registry
  )) as IGatewayRegistry;
  const mintGatewaySymbols = await gatewayRegistry.getMintGatewaySymbols(0, 0);

  for (let symbol = 0; symbol < mintGatewaySymbols.length; symbol++) {
    const mintGatewayAddress = await gatewayRegistry.getMintGatewayBySymbol(
      mintGatewaySymbols[symbol]
    );
    const assetAddress = await gatewayRegistry.getRenAssetBySymbol(
      mintGatewaySymbols[symbol]
    );

    const renAsset: AssetInfo = {
      tokenAddress: assetAddress,
      mintGatewayAddress: mintGatewayAddress,
    };
    renAssetMapping[mintGatewaySymbols[symbol]] = renAsset;

    const addToken = await bridge
      .connect(deployer)
      .addToken(
        mintGatewaySymbols[symbol],
        renAssetMapping[mintGatewaySymbols[symbol]].tokenAddress
      );
    const receipt = await addToken.wait(1);
    console.log(receipt);
  }
};

async function main(registry: string, addInConstructor: boolean) {
  let [deployer] = await ethers.getSigners();

  if (addInConstructor) {
    const { mintGatwayAddresses, assetAddresses, mintGatewaySymbols } =
      await addTokensInConstructor(registry);

    console.log(mintGatwayAddresses, assetAddresses, mintGatewaySymbols);
    Bridge = (await ethers.getContractFactory(
      "RenBridge"
    )) as RenBridge__factory;
    bridge = (await Bridge.connect(deployer).deploy(
      registry,
      mintGatwayAddresses,
      assetAddresses,
      mintGatewaySymbols,
      true
    )) as RenBridge;

    await bridge.deployed();
  } else {
    //2 deploy bridge
    Bridge = (await ethers.getContractFactory(
      "RenBridge"
    )) as RenBridge__factory;
    bridge = (await Bridge.connect(deployer).deploy(
      registry,
      [],
      [],
      [],
      false
    )) as RenBridge;
    await bridge.deployed();
    await addTokensAdterDeployment(registry, bridge, deployer);
  }

  //pront tokenList
  const tokenList = await bridge.getTokenList();
  console.log(`contract deployed to ${bridge.address}`);
  console.log(`with supported token array ${tokenList}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main("0x5076a1F237531fa4dC8ad99bb68024aB6e1Ff701", true).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

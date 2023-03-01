import { ethers } from "hardhat";
import { RenBridge } from "../typechain-types";
import { RenBridge__factory } from "../typechain-types";
import { IGatewayRegistry } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { TestRenBridge__factory } from '../typechain-types/factories/testBridge.sol/TestRenBridge__factory';
import { TestRenBridge } from '../typechain-types/testBridge.sol/TestRenBridge';

let Bridge: TestRenBridge__factory;
let bridge: TestRenBridge;


async function main(registry: string) {
  let [deployer] = await ethers.getSigners();

  Bridge = (await ethers.getContractFactory(
    "TestRenBridge"
  )) as TestRenBridge__factory;

  bridge = (await Bridge.connect(deployer).deploy(
    registry
  )) as TestRenBridge;

  await bridge.deployed();
  console.log(`contract deployed to ${bridge.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main("0x5076a1F237531fa4dC8ad99bb68024aB6e1Ff701").catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

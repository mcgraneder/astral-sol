import { AstralBridgeFactory__factory } from "../typechain-types/factories/contracts/AstralABridge/AstralBridgeFACTORY.sol/AstralBridgeFactory__factory";
import { AstralBridgeFactory } from "../typechain-types/contracts/AstralABridge/AstralBridgeFACTORY.sol/AstralBridgeFactory";
import { AstralERC20Logic } from "../typechain-types/contracts/AstralABridge/AstralERC20Asset/AstralERC20.sol/AstralERC20Logic";
import { BridgeBase } from "../typechain-types";
import { ethers } from "hardhat";
import config from "hardhat";
import { TestNativeAssetRegistry } from "../typechain-types/contracts/AstralABridge/tesNativeAssetRegistry.sol/TestNativeAssetRegistry";
import { TestNativeAssetRegistry__factory } from "../typechain-types/factories/contracts/AstralABridge/tesNativeAssetRegistry.sol/TestNativeAssetRegistry__factory";
import { TestNativeERC20Asset__factory } from "../typechain-types/factories/contracts/AstralABridge/TestNativeERC20Asset__factory";
import { TestNativeERC20Asset } from "../typechain-types/contracts/AstralABridge/TestNativeERC20Asset";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

let astralUSDT: AstralERC20Logic;
let astralUSDTBridge: BridgeBase;
let bridgeFACTORY: AstralBridgeFactory;
let mainAccount: any;
let privKey: Buffer;
let OWNER_PRIVKEY: Buffer;
let nativeAssetRegistry: TestNativeAssetRegistry;
let testNativeERC20Asset: TestNativeERC20Asset;

let ALICE: SignerWithAddress;
let BOB: SignerWithAddress;
let CHARLIE: SignerWithAddress;

// Owner
let OWNER: SignerWithAddress;

async function main() {
  // const signer = new Wallet(account.privateKey, provider);
  [OWNER, ALICE] = await ethers.getSigners();

  // const TestNativeERC20Asset = (await ethers.getContractFactory(
  //   "TestNativeERC20Asset"
  // )) as TestNativeERC20Asset__factory;

  // testNativeERC20Asset = (await TestNativeERC20Asset.connect(ALICE).deploy(
  //   "USDT",
  //   "USDT Tether",
  //   18,
  //   "100000000000000000000"
  // )) as TestNativeERC20Asset;

  // await testNativeERC20Asset.deployed();

  // console.log(`deployed test USDT to address ${testNativeERC20Asset.address}`)

  //deploy testNative asset registry
  // const NativeAssetRegistry = (await ethers.getContractFactory(
  //   "TestNativeAssetRegistry"
  // )) as TestNativeAssetRegistry__factory;

  // nativeAssetRegistry = (await NativeAssetRegistry.connect(OWNER).deploy([
  //   "0x270203070650134837F3C33Fa7D97DC456eF624e", //USDT
  // ])) as TestNativeAssetRegistry;

  // await nativeAssetRegistry.deployed();

  // console.log(
  //   `deployed test native asset registry to ${nativeAssetRegistry.address}`
  // );

  //deploy bridge factory
  const BridgeFACTORY = (await ethers.getContractFactory(
    "AstralBridgeFactory"
  )) as AstralBridgeFactory__factory;

  const bridgeFACTORY = (await BridgeFACTORY.connect(ALICE).deploy(
    ALICE.address
  )) as AstralBridgeFactory;

  await bridgeFACTORY.deployed();

  console.log(`bridge factory deployed to address ${bridgeFACTORY.address}\n`);

  //deploy astral asset and corresponding bridge
  const tx = await bridgeFACTORY.connect(ALICE).deployAssetAndBridge(
    "astralUSDT",
    "AstralUSDT",
    "aUSDT",
    "0x270203070650134837F3C33Fa7D97DC456eF624e", //USSDT
    6,
    { gasLimit: 7000000 }
  );

  await tx.wait(1);

  const astralUSDTAddress = await bridgeFACTORY.getAssetBySymbol("aUSDT");
  const astralUSDTBridgeAddress = await bridgeFACTORY.getBridgeBySymbol(
    "aUSDT"
  );

  astralUSDT = (await ethers.getContractAt(
    "AstralERC20Logic",
    astralUSDTAddress
  )) as AstralERC20Logic;

  astralUSDTBridge = (await ethers.getContractAt(
    "BridgeBase",
    astralUSDTBridgeAddress
  )) as BridgeBase;

  console.log(
    `Sucessfully deployed token  to address ${astralUSDT.address}, with bridge at address ${astralUSDTBridge.address}`
  );
  console.log(
    `owner balance of  is ${Number(await astralUSDT.balanceOf(ALICE.address))}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

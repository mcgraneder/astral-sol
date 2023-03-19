const Web3 = require("web3");

import { MultiCallService } from "@1inch/multicall";
import { Web3ProviderConnector } from "@1inch/multicall/connector";
import { MultiCallParams } from "@1inch/multicall/model";
import { Bitcoin } from "@renproject/chains-bitcoin";
import {
  BinanceSmartChain,
  Goerli,
  Ethereum,
  Avalanche,
  Fantom,
  Polygon,
  Kava,
  Moonbeam,
} from "@renproject/chains-ethereum";

//chainIds in official ren package incorrect. correct change
//made in these ovverride configs
import { Optimism } from "./chain/OptimismOverrideConfig";
import { Arbitrum } from "./chain/ArbitrumOverrideConfig";

import { RenJS } from "@renproject/ren";
import { RenNetwork } from "@renproject/utils";
import BigNumber from "bignumber.js";
import cors from "cors";
import { config } from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import hre, { ethers } from "hardhat";
import { ADMIN_KEY } from "../utils/config";
import { APIError } from "./utils/APIError";
import TokenMulticall from "./utils/multicall";
import { getEVMProvider, getEVMChain, getChain } from "./utils/getProvider";
import { Chain, Asset } from "@renproject/chains";
import { EthereumBaseChain } from "@renproject/chains-ethereum/base";
import { PorividerConfig } from "./constant/networks";
import { chainsBaseConfig } from "./constant/constants";
import { MulticallReturn, MulticallAsset } from "./types/index";
import { RenBridge } from "../typechain-types/Bridge.sol/RenBridge";
import { BridgeDeployments } from "../utils/deployments";
import BridgeABI from "../utils/ABIs/BridgeABI.json";
import { returnContract } from "./utils/getContract";
import { IERC20 } from "../typechain-types";
import { ERC20ABI } from "@renproject/chains-ethereum/contracts";
import { BigNumber as BN } from "ethers";
import { Contract } from "@ethersproject/contracts";
import { BridgeBase } from "../typechain-types/contracts/AstralABridge/BridgeBaseAdapter.sol/BridgeBase";
import { TestNativeERC20Asset } from "../typechain-types/contracts/AstralABridge/TestNativeERC20Asset";
import { TestNativeAssetRegistry } from "../typechain-types/contracts/AstralABridge/tesNativeAssetRegistry.sol/TestNativeAssetRegistry";
import { AstralERC20Logic } from "../typechain-types/contracts/AstralABridge/AstralERC20Asset/AstralERC20.sol/AstralERC20Logic";
import AstralERC20AssetABI from "../constants/ABIs/AstralERC20AssetABI.json";
import BridgeAdapterABI from "../constants/ABIs/BridgeAdapterABI.json";
import BridgeFactoryABI from "../constants/ABIs/BridgeFactoryABI.json";
import TestNativeAssetRegistryABI from "../constants/ABIs/TestNativeAssetRegistryABI.json";
import TestNativeERC20AssetABI from "../constants/ABIs/TestNativeERC20AssetABI.json";
import {
  BridgeAssets,
  testNativeAssetDeployments,
  registries,
  BridgeFactory,
} from "../constants/deployments";
import { ecrecover, ecsign, pubToAddress } from "ethereumjs-util";
import { randomBytes, Ox } from "./utils/cryptoHelpers";
import { keccak256 } from "web3-utils";
import Firebase from "./services/firebase-admin";
import Collections from "./services/Collections";
import { updateTransaction } from './TransactionWatcher/src/Database/controllers/Transactons';

const isAddressValid = (address: string): boolean => {
  if (/^0x[a-fA-F0-9]{40}$/.test(address)) return true;
  return false;
};

config();

const app = express();
const port = 4000;
const nonceOfset = 1;

let BitcoinChain: Bitcoin;
let EthereumChain: Ethereum;
let BinanceSmartChainChain: BinanceSmartChain;
let ArbitrumChain: Arbitrum;
let AvalancheChain: Avalanche;
let PolygonChain: Polygon;
let KavaChain: Kava;
let MoonBeamChain: Moonbeam;
let OptimismChain: Optimism;
let FantomChain: Fantom;

let RenJSProvider: RenJS;

let multicallService: MultiCallService;
let chainProvider: any;
let MulticallProvider: Web3ProviderConnector;

let astralUSDTBridgeEth: BridgeBase;
let astralUSDTBridgeBsc: BridgeBase;
let testNativeERC20Asset: TestNativeERC20Asset;
let registry: TestNativeAssetRegistry;
let registryEth: TestNativeAssetRegistry;
let provider: any;
let providerBsc: any;

app.use(express.json());
app.use(cors({ origin: "*" }));

app.get("/", (req, res) => {
  res.status(200).send({ result: "ok" });
});

async function updateFirebaseTx(
  userCollectionRef: FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData>,
  account: string,
  currentStatus: string,
  newStatus: string
) {
  const txSnapshot = await userCollectionRef
    .where("accountId", "==", account)
    .get();

  if (txSnapshot.empty) {
    console.log(`user does not exists`)
    return;
  }
  const userSnapshot = await userCollectionRef.doc(txSnapshot.docs[0].id).get();
  const userDocRef = userSnapshot.ref;
  const renVMTxIdDocSnapshot = await userDocRef
    .collection(Collections.txs)
    .where("status", "==", currentStatus)
    .get();
  
    const txData = renVMTxIdDocSnapshot.docs[0].data();

    console.log(renVMTxIdDocSnapshot)

  if (renVMTxIdDocSnapshot.empty) {
    console.log(`Transaction does not exists`);
    return;
  }

  const renVMTxSnapshot = renVMTxIdDocSnapshot.docs[0].id;
  await userDocRef
    .collection(Collections.txs)
    .doc(renVMTxSnapshot)
    .update({ status: newStatus });

    return txData;
}

function requireQueryParams(params: Array<string>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const fails: string[] = [];
    for (const param of params) {
      if (!req.query[param]) {
        fails.push(param);
      }
    }
    if (fails.length > 0) {
      res.status(400).send(`${fails.join(",")} required`);
    } else {
      next();
    }
  };
}

app.get("/testFirebase", async (req, res) => {
  const { userCollectionRef } = await Firebase();
  const txData = await updateFirebaseTx(
    userCollectionRef,
    "0xD2E9ba02300EdfE3AfAe675f1c72446D5d4bD149",
    "verifying",
    "complete"
  );

  res.json({
    result: txData,
  });
});

// /**
//  * Get mint assets for bridge contract on given chain
//  * */
app.get(
  "/getTokenApproval",
  requireQueryParams(["chainName", "assetName", "account"]),
  async (req, res) => {
    console.log("GET /bridgeTokens");
    const chainName = req.query.chainName!.toString();
    const assetName = req.query.assetName!.toString();
    const account = req.query.account!.toString();

    const assets = chainsBaseConfig[chainName].assets;

    const { provider } = getChain(RenJSProvider, chainName, RenNetwork.Testnet);

    const tokenContract = (await returnContract(
      assets[assetName].tokenAddress,
      ERC20ABI,
      provider
    )) as IERC20;

    const allowance = await tokenContract.allowance(
      account,
      BridgeDeployments[chainName]
    );

    res.json({
      result: allowance,
    });
  }
);

// /**
//  * Get mint assets for bridge contract on given chain
//  * */
app.get(
  "/bridgeTokens",
  requireQueryParams(["chainName"]),
  async (req, res) => {
    console.log("GET /bridgeTokens");
    const chainName = req.query.chainName!.toString();
    // const account = req.query.chainName!.toString();

    const { provider, signer } = getChain(
      RenJSProvider,
      chainName,
      RenNetwork.Testnet
    );

    const bridgeContract = (await returnContract(
      BridgeDeployments[chainName],
      BridgeABI,
      provider
    )) as RenBridge;

    const bridgeMintAssets = await bridgeContract.getTokenList();

    res.json({
      result: bridgeMintAssets,
    });
  }
);

// /**
//  * Get mint assets for bridge contract on given chain
//  * */
app.get(
  "/getSingleBalance",
  requireQueryParams(["chainName", "assetName", "account"]),
  async (req, res) => {
    console.log("GET /bridgeTokens");
    const chainName = req.query.chainName!.toString();
    const assetName = req.query.assetName!.toString();
    const account = req.query.account!.toString();

    const assets = chainsBaseConfig[chainName].assets;

    const { provider } = getChain(RenJSProvider, chainName, RenNetwork.Testnet);

    const tokenContract = (await returnContract(
      assets[assetName].tokenAddress,
      ERC20ABI,
      provider
    )) as IERC20;

    const bridgeContract = (await returnContract(
      BridgeDeployments[chainName],
      BridgeABI,
      provider
    )) as RenBridge;

    const balanceProms: BN[] = [
      await tokenContract.balanceOf(account),
      await bridgeContract.getUserbalanceInContract(
        assets[assetName].tokenAddress,
        account
      ),
    ];
    const [tokenBalance, bridgeBalance] = await Promise.all(balanceProms);

    res.json({
      balances: {
        tokenBalance: tokenBalance,
        bridgeBalance: bridgeBalance,
        b: assets[assetName].tokenAddress,
      },
    });
  }
);

// /**
//  * Get mint assets for bridge contract on given chain
//  * */
app.get(
  "/getAssetBalance",
  requireQueryParams(["chainName", "assetName", "account"]),
  async (req, res) => {
    console.log("GET /bridgeTokens");
    const chainName = req.query.chainName!.toString();
    const assetName = req.query.assetName!.toString();
    const account = req.query.account!.toString();

    const assets = chainsBaseConfig[chainName].assets;

    const { provider } = getChain(RenJSProvider, chainName, RenNetwork.Testnet);

    const tokenContract = (await returnContract(
      assets[assetName].tokenAddress,
      ERC20ABI,
      provider
    )) as IERC20;

    const allowance = await tokenContract.allowance(
      account,
      BridgeDeployments[chainName]
    );

    res.json({
      result: allowance,
    });
  }
);

/**
 * Get the catalog token balances of all registered tokens for the specified user.
 */
app.get(
  "/balancesOf",
  requireQueryParams(["of", "chainName"]),
  async (req, res) => {
    console.log("GET /balancesOf");
    const of = req.query.of!.toString();
    const chainName = req.query.chainName!.toString();

    chainProvider = new Web3(
      new Web3.providers.HttpProvider(PorividerConfig[chainName].url)
    );

    MulticallProvider = new Web3ProviderConnector(chainProvider);
    multicallService = new MultiCallService(
      MulticallProvider,
      chainsBaseConfig[chainName].multicallContract
    );

    let balancesMap = {} as { [x: string]: MulticallReturn };
    const assets = Object.values(chainsBaseConfig[chainName].assets);
    const tickers = Object.keys(chainsBaseConfig[chainName].assets);

    const { bridgeTokenBalances, walletTokenBalances } = await TokenMulticall(
      multicallService,
      MulticallProvider,
      chainName,
      of,
      assets
    );

    assets.forEach((asset: MulticallAsset, index: number) => {
      balancesMap[tickers[index]] = {
        tokenAddress: asset.tokenAddress,
        chain: chainName as Chain,
        asset: tickers[index] as Asset,
        walletBalance: MulticallProvider.decodeABIParameter<BigNumber>(
          "uint256",
          walletTokenBalances[index]
        ).toString(),
        bridgeBalance: MulticallProvider.decodeABIParameter<BigNumber>(
          "uint256",
          bridgeTokenBalances[index]
        ).toString(),
      };
    });

    res.json({
      result: {
        multicall: balancesMap,
      },
    });
  }
);

app.use((err: APIError, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  err.status = err.status || 500;
  if (!(err instanceof APIError)) {
    err = new APIError((err as any).message, null, (err as any).status);
  }
  res.status(err.status).send(err.toJson());
});

app.use((req, res, next) => {
  res.status(404).send("Nothing here :)");
});

async function setup() {
  const network = RenNetwork.Testnet;

  ArbitrumChain = getEVMChain(Arbitrum, network, { privateKey: ADMIN_KEY });
  AvalancheChain = getEVMChain(Avalanche, network, { privateKey: ADMIN_KEY });
  BinanceSmartChainChain = getEVMChain(BinanceSmartChain, network, {
    privateKey: ADMIN_KEY,
  });
  FantomChain = getEVMChain(Fantom, network, { privateKey: ADMIN_KEY });
  PolygonChain = getEVMChain(Polygon, network, { privateKey: ADMIN_KEY });
  OptimismChain = getEVMChain(Optimism, network, { privateKey: ADMIN_KEY });
  MoonBeamChain = getEVMChain(Moonbeam, network, { privateKey: ADMIN_KEY });
  KavaChain = getEVMChain(Kava, network, { privateKey: ADMIN_KEY });
  EthereumChain = new Ethereum({
    network,
    defaultTestnet: "goerli",
    // ...getEVMProvider(Ethereum, network, catalogAdminKey),
    ...getEVMProvider(Goerli, network, { privateKey: ADMIN_KEY }),
  });

  RenJSProvider = new RenJS(RenNetwork.Testnet).withChains(
    ArbitrumChain,
    AvalancheChain,
    BinanceSmartChainChain,
    EthereumChain,
    FantomChain,
    PolygonChain,
    OptimismChain,
    KavaChain,
    MoonBeamChain
  );

  EthereumChain.signer
    ?.getAddress()
    .then((address: string) => {
      console.log(`Fetching ${address} balances...`);
    })
    .catch(() => {});
  [
    ArbitrumChain,
    AvalancheChain,
    BinanceSmartChainChain,
    EthereumChain,
    FantomChain,
    PolygonChain,
    OptimismChain,
    KavaChain,
    MoonBeamChain,
  ].forEach(async (chain: EthereumBaseChain) => {
    try {
      console.log(
        `${chain.chain} balance: ${ethers.utils.formatEther(
          await chain.signer!.getBalance()
        )} ${chain.network.config.nativeCurrency.symbol}`
      );
    } catch (error) {
      console.error(`Unable to fetch ${chain.chain} balance.`);
    }
  });

  const { provider } = getChain(
    RenJSProvider,
    Ethereum.chain,
    RenNetwork.Testnet
  );

  const { provider: providerBsc } = getChain(
    RenJSProvider,
    BinanceSmartChain.chain,
    RenNetwork.Testnet
  );

  console.log(provider);

  astralUSDTBridgeEth = (await returnContract(
    BridgeAssets[Ethereum.chain]["aUSDT"].bridgeAddress,
    BridgeAdapterABI,
    provider
  )) as BridgeBase;

  astralUSDTBridgeBsc = (await returnContract(
    BridgeAssets[BinanceSmartChain.chain]["aUSDT"].bridgeAddress,
    BridgeAdapterABI,
    providerBsc
  )) as BridgeBase;

  testNativeERC20Asset = (await new Contract(
    testNativeAssetDeployments[Ethereum.chain]["USDT"],
    ERC20ABI,
    provider
  )) as TestNativeERC20Asset;

  registry = (await ethers.getContractAt(
    "TestNativeAssetRegistry",
    registries[BinanceSmartChain.chain]
  )) as TestNativeAssetRegistry;

  registryEth = (await ethers.getContractAt(
    "TestNativeAssetRegistry",
    registries[Ethereum.chain]
  )) as TestNativeAssetRegistry;
}

setup().then(() =>
  app.listen(port, () => {
    console.log(`listening at http://localhost:${port}`);

    const { signer } = getChain(
      RenJSProvider,
      BinanceSmartChain.chain,
      RenNetwork.Testnet
    );

    const { signer: signerEth } = getChain(
      RenJSProvider,
      EthereumChain.chain,
      RenNetwork.Testnet
    );

    astralUSDTBridgeEth.on(
      "AssetLocked",
      async (_from, _value, timestamp, _nonce) => {
        const { userCollectionRef } = await Firebase();

        // await updateFirebaseTx(userCollectionRef, _from, "pending", "verifying");

        console.log(_from, _value, timestamp);
        const ADMIN_PRIVATE_KEY = Buffer.from(ADMIN_KEY, "hex");

        const nHash = keccak256(
          ethers.utils.defaultAbiCoder.encode(
            ["uint256", "uint256"],
            [_nonce, _value]
          )
        );
        const pHash = keccak256(
          ethers.utils.defaultAbiCoder.encode(
            ["uint256", "address"],
            [_value, _from]
          )
        );

        const hash = await astralUSDTBridgeBsc.hashForSignature(
          pHash,
          _value,
          _from,
          nHash
        );

        const sig = ecsign(
          Buffer.from(hash.slice(2), "hex"),
          ADMIN_PRIVATE_KEY
        );

        const publicKeyToAddress = pubToAddress(
          ecrecover(Buffer.from(hash.slice(2), "hex"), sig.v, sig.r, sig.s)
        ).toString("hex");

        const sigString = Ox(
          `${sig.r.toString("hex")}${sig.s.toString("hex")}${sig.v.toString(
            16
          )}`
        );

        const veririedSignature = await astralUSDTBridgeEth.verifySignature(
          hash,
          sigString
        );

        console.log(`verified signature: ${veririedSignature}`);
        console.log(`sig string: ${sigString}`);
        console.log(`public key to address: ${publicKeyToAddress}`);
        console.log(`hash: ${hash}`);

        const mintTransaction = await astralUSDTBridgeBsc
          .connect(signer)
          .mint(pHash, nHash, sigString, _value, _nonce, _from);
        const mintTxReceipt = await mintTransaction.wait(1);

        const txData = await updateFirebaseTx(
          userCollectionRef,
          "0xD2E9ba02300EdfE3AfAe675f1c72446D5d4bD149",
          "verifying",
          "complete"
        );

        console.log(mintTxReceipt)
      }
    );

    astralUSDTBridgeBsc.on(
      "AssetBurnt",
      async (_from, _value, timestamp, _nonce) => {
        console.log(_from, _value, timestamp);

        const ADMIN_PRIVATE_KEY = Buffer.from(ADMIN_KEY, "hex");

        const nHash = keccak256(
          ethers.utils.defaultAbiCoder.encode(
            ["uint256", "uint256"],
            [_nonce, _value]
          )
        );
        const pHash = keccak256(
          ethers.utils.defaultAbiCoder.encode(
            ["uint256", "address"],
            [_value, _from]
          )
        );

        const hash = await astralUSDTBridgeEth.hashForSignature(
          pHash,
          _value,
          _from,
          nHash
        );
        const sig = ecsign(
          Buffer.from(hash.slice(2), "hex"),
          ADMIN_PRIVATE_KEY
        );

        const publicKeyToAddress = pubToAddress(
          ecrecover(Buffer.from(hash.slice(2), "hex"), sig.v, sig.r, sig.s)
        ).toString("hex");

        const sigString = Ox(
          `${sig.r.toString("hex")}${sig.s.toString("hex")}${sig.v.toString(
            16
          )}`
        );

        const veririedSignature = await astralUSDTBridgeBsc.verifySignature(
          hash,
          sigString
        );

        console.log(`verified signature: ${veririedSignature}`);
        console.log(`sig string: ${sigString}`);
        console.log(`public key to address: ${publicKeyToAddress}`);
        console.log(`hash: ${hash}`);

        console.log(_from);
        const mintTransaction = await astralUSDTBridgeEth
          .connect(signerEth)
          .release(
            pHash,
            nHash,
            sigString,
            _value,
            testNativeERC20Asset.address,
            _from,
            _nonce,
            registryEth.address
          );
        const mintTxReceipt = await mintTransaction.wait(1);

        console.log(mintTransaction);
      }
    );
  })
);

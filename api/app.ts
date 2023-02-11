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


const isAddressValid = (address: string): boolean => {
  if (/^0x[a-fA-F0-9]{40}$/.test(address)) return true;
  return false;
};

config();

const app = express();
const port = 4000;

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

app.use(express.json());
app.use(cors({ origin: "*" }));

app.get("/", (req, res) => {
  res.status(200).send({ result: "ok" });
});

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
      await bridgeContract.getUserbalanceInContract(assets[assetName].tokenAddress, account)
    ] 
    const  [tokenBalance, bridgeBalance] = await Promise.all(balanceProms)

    res.json({
      balances: {
        tokenBalance: tokenBalance,
        bridgeBalance: bridgeBalance,
        b: assets[assetName].tokenAddress
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
}

setup().then(() =>
  app.listen(port, () => {
    console.log(`listening at http://localhost:${port}`);
  })
);

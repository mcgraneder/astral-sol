const Web3 = require("web3");

import { MultiCallService } from "@1inch/multicall";
import { Web3ProviderConnector } from "@1inch/multicall/connector";
import { MultiCallParams } from "@1inch/multicall/model";
import { Bitcoin } from "@renproject/chains-bitcoin";
import { BinanceSmartChain, Goerli, Ethereum, Arbitrum, Avalanche, Fantom, Polygon, Kava, Moonbeam, Optimism } from '@renproject/chains-ethereum';
import { MockChain } from "@renproject/mock-provider";
import { RenJS } from "@renproject/ren";
import {  RenNetwork } from "@renproject/utils";
import BigNumber from "bignumber.js";
import cors from "cors";
import { config } from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import hre, { ethers } from "hardhat";
import { ADMIN_KEY } from "../utils/config";
import { RenChain } from "./chain/Renchain";
import { APIError } from "./utils/APIError";
import TokenMulticall from "./utils/multicall";
import { getEVMProvider, getEVMChain, EVMConstructor } from './utils/getProvider';
import { Chain } from '@renproject/chains';
import { EthereumBaseChain } from '@renproject/chains-ethereum/base';
import { PorividerConfig } from "./constant/networks";

const isAddressValid = (address:string):boolean  => {
    if(/^0x[a-fA-F0-9]{40}$/.test(address)) return  true
    return false
}

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
let OptimismChain: Optimism
let FantomChain: Fantom

let RenJSProvider: RenJS

let network: RenNetwork;
let MulticallService: MultiCallService;
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

/**
 * Get catalog token balance of a metaversal account
 * */
app.get("/balanceOf", requireQueryParams(["token", "of"]), async (req, res) => {
  console.log("GET /balanceOf");
  const token = req.query.token!.toString();
  const of = req.query.of!.toString();
  console.log("token = " + token);
  console.log("of = " + of);

  if (!isAddressValid(of)) throw new APIError("Invalid user address");
  if (!isAddressValid(token)) throw new APIError("Invalid token address");

  let balance = await Catalog.balanceOf(token, of);
  console.log("balance = " + balance.toString());
  res.json({ result: balance.toString() });
});

/**
 * Get the catalog token balances of all registered tokens for the specified user.
 */
app.get("/balancesOf", requireQueryParams(["of"]), async (req, res) => {
  console.log("GET /balancesOf");
  const of = req.query.of!.toString();
  const chainName = req.query.chainName!.toString();

  const batchSize = parseInt(req.query.batchSize!.toString());
  if (!isAddressValid(of)) throw new APIError("Invalid address");

    chainProvider = new Web3(new Web3.providers.HttpProvider(
        PorividerConfig[chainName].url
    ));

    MulticallProvider = new Web3ProviderConnector(chainProvider);
    MulticallService = new MultiCallService(
      MulticallProvider,
      MulticallAddressFromNetwork[NETWORKS.ETHEREUM_GOERLI]
    );

  // The parameters are optional, if not specified, the default will be used
  const params: MultiCallParams = {
    chunkSize: Number(batchSize),
    retriesLimit: 3,
    blockNumber: "latest",
  };

  let balancesMap = {} as { [x: string]: string };
  let allowancesMap = {} as { [x: string]: string };

  const { ethereumBalances, ethereumAllowances, } = await TokenMulticall(
    MulticallService,
    MulticallProvider,
    of,
    tokens,
    params,
    network
  );

  tokens["Ethereum"].forEach((token: TokenInfo, i: number) => {
    try {
      balancesMap[token.address] = MulticallProvider
        .decodeABIParameter<BigNumber>("uint256", ethereumBalances[i])
        .toString();
    } catch (error) {
      balancesMap[token.address] = "0";
    }
    try {
      allowancesMap[token.address] = MulticallProvider
        .decodeABIParameter<BigNumber>("uint256", ethereumAllowances[i])
        .toString();
    } catch (error) {
      allowancesMap[token.address] = "0";
    }
  });

  for (const token of registeredTokens) {
    token.balance = balancesMap[token.address];
    token.allowance = allowancesMap[token.address];
    token.earning = "0";
  }

  res.json({
    result: {
      registeredTokens: registeredTokens,
      balances: balancesMap,
      allowances: allowancesMap,
    },
  });
});

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

    const network = RenNetwork.Testnet

    ArbitrumChain = getEVMChain(Arbitrum, network, { privateKey: ADMIN_KEY });
    AvalancheChain = getEVMChain(Avalanche, network, { privateKey: ADMIN_KEY });
    BinanceSmartChainChain = getEVMChain(BinanceSmartChain, network, { privateKey: ADMIN_KEY });
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
        ArbitrumChain, AvalancheChain, BinanceSmartChainChain, EthereumChain, 
        FantomChain, PolygonChain, OptimismChain, KavaChain, MoonBeamChain
    ]
    .forEach(async (chain: EthereumBaseChain) => {
    try {
      console.log(
        `${chain.chain} balance: ${ethers.utils.formatEther(await chain.signer!.getBalance())} ${
          chain.network.config.nativeCurrency.symbol
        }`
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

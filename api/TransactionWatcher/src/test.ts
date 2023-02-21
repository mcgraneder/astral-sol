import express from "express";
import http from "http";
import mongoose from "mongoose";
import { config } from "./utils/config";
import { get, patch, post } from "./utils/axios";
import { BitcoinResponse, ScriptPubKey } from "./types/bitcoinTypes";
import { createUser, readUser } from "./Database/controllers/User";
import { updateTransaction } from "./Database/controllers/Transactons";
import RenJS from "@renproject/ren";
import { Gateway } from "@renproject/ren";
import {
  createTransaction,
  readTransaction,
  readAllTransaction,
} from "./Database/controllers/Transactons";
import { Bitcoin, Ethereum, Catalog } from "@renproject/chains";
import { RenNetwork } from "@renproject/utils";
import { useLatestTransactionsContainer } from "./ren/renTransactionFetcher";
import Logging from "./utils/logger";
import timer from "timers";
import { NETWORK } from "./utils/emviornmentVariables";

const QUICKNODE_ADDRESS_LOOKUP_URL =
  "https://cool-wandering-needle.btc-testnet.quiknode.pro/c59312656d877d9fdd50590cbdfba1251298f36c/";
const BTC_NODE_CONNECTION_URL =
  "https://api.blockcypher.com/v1/btc/test3/addrs/";

const router = express();

const connectToDB = async (): Promise<void> => {
  mongoose
    .connect(config.mongo.url, { retryWrites: true, w: "majority" })
    .then(() => {
      console.log("connected");
      StartServer();
    })
    .catch((error) => console.error(error));
};

interface Props {
  renJS: RenJS;
  gateway: Gateway | undefined;
  onGateway: (gateway: Gateway) => void;
}

const getCurrentGateway = async () => {
  const asset = "BTC";
  const network = NETWORK;
  const ethereum = new Catalog({
    // Use Ethereum on mainnet
    network,
    // Use public provider URL
    provider: Catalog.configMap[network]!.config.rpcUrls[0],
  });
  const bitcoin = await new Bitcoin({ network });
  const renJS = await new RenJS(network).withChains(ethereum, bitcoin);

  // const asset = "BTC";
  const toChain = renJS.getChain<Catalog>("Catalog");
  const fromChain = renJS.getChain<Bitcoin>("Bitcoin");

  const toCon = toChain.Contract({
    to: "0xa3DEB3F1A03A505502C1b7D679521f93F1105542",
    method: "mint",
    params: [
      {
        name: "_token",
        type: "address",
        value: "0x13480Ea818fE2F27b82DfE7DCAc3Fd3E63A94113",
      },
      {
        name: "_to",
        type: "address",
        value: "0x13480Ea818fE2F27b82DfE7DCAc3Fd3E63A94113",
      },
    ],
    withRenParams: true,
  });

  const gateway = await renJS.gateway({
    asset,
    from: fromChain.GatewayAddress(),
    to: toCon,
  });

  //   console.log(gateway.gatewayAddress)
  return gateway.gatewayAddress;
};

const transactionUpdater = async () => {
  //   setInterval(async () => {
  const transactions = await readAllTransaction();
  // console.log(transactions);

  const txParams = transactions.map((tx: any) => {
    return {
      jsonrpc: "1.0",
      method: "getrawtransaction",
      params: [tx.address, 1],
    };
  });

  const transactionObjects = (await post(
    QUICKNODE_ADDRESS_LOOKUP_URL,
    txParams
  )) as any;

  if (transactionObjects.length > 0) {
    transactionObjects.forEach(async (tx: any, i: number) => {
      const { txid, txStatus } = await useLatestTransactionsContainer(
        transactions[i].address,
        transactions[i].bitcoinId,
        transactions[i].status
      );
      if (
        tx.result?.confirmations !== transactions[i].confirmations ||
        txid !== transactions[i].bitcoinId ||
        txStatus !== transactions[i].status
      ) {
        await updateTransaction(
          transactions[i].address,
          tx.result?.confirmations,
          tx.result?.time,
          txid,
          txStatus
        );
      }
    });
  }
  //   }, 10000);
};

const watchBitcoinTransactions = async () => {
  //   setInterval(async () => {
  const gatewayAddress = await getCurrentGateway();
  const mempoolTransactions = (await post(QUICKNODE_ADDRESS_LOOKUP_URL, {
    jsonrpc: "1.0",
    method: "getrawmempool",
    params: [true, false],
  })) as BitcoinResponse;

  const transactionAddresses = Object.keys(mempoolTransactions.result);
  //   console.log(transactionAddresses)
  const txParams = transactionAddresses.map((tx: string) => {
    return {
      jsonrpc: "1.0",
      method: "getrawtransaction",
      params: [tx, 1],
    };
  });
  const transactionObjects = (await post(
    QUICKNODE_ADDRESS_LOOKUP_URL,
    txParams
  )) as any;

  transactionObjects?.forEach(async (tx: any) => {
    // console.log(tx)
    if (tx?.result) {
      //handle case where vout has multiple out addresses
      let user;
      if (Array.isArray(tx?.result.vout[1]?.scriptPubKey?.address)) {
        tx?.result.vout[1]?.scriptPubKey?.address.forEach(
          async (address: string) => {
            user = await readUser(address);
          }
        );
      } else {
        user = await readUser(tx?.result.vout[1]?.scriptPubKey?.address);
      }

      //handle case where vout has multiple out addresses
      // console.log(tx?.result.vout[0].scriptPubKey.address)
      let gatewayFound: boolean = false;
      if (Array.isArray(tx?.result.vout[0]?.scriptPubKey?.address)) {
        tx?.result.vout[0]?.scriptPubKey?.address.forEach(
          async (address: string) => {
            gatewayFound = address === gatewayAddress;
          }
        );
      } else {
        gatewayFound =
          tx?.result.vout[0].scriptPubKey.address === gatewayAddress;
      }
      // if (gatewayFound && (!user || user.length == 0)) {
      //     // user = await readUser(tx?.result.vout[1]?.scriptPubKey?.address);
      //     await createUser(tx?.result.vout[1]?.scriptPubKey?.address);
      // }
      // console.log("user", user)
      if (
        //handle case where vout has multiple out addresses
        tx?.result.vout[0].scriptPubKey.address === gatewayAddress &&
        user
      ) {
        const doesTransactionExist = await readTransaction(tx?.result.txid);

        if (doesTransactionExist) console.log("tx exists");
        if (!doesTransactionExist) {
          createTransaction(
            tx?.result.txid,
            tx?.result.vout[0].scriptPubKey.address,
            tx?.result.vout[0].value
          );
          console.log("created");
        }
      }
    }
  });
  //   }, 10000);
};

/** Only Start Server if Mongoose Connects */
const StartServer = () => {
  /** Log the request */
  router.use((req, res, next) => {
    /** Log the req */
    Logging.info(
      `Incomming - METHOD: [${req.method}] - URL: [${req.url}] - IP: [${req.socket.remoteAddress}]`
    );

    res.on("finish", () => {
      /** Log the res */
      Logging.info(
        `Result - METHOD: [${req.method}] - URL: [${req.url}] - IP: [${req.socket.remoteAddress}] - STATUS: [${res.statusCode}]`
      );
    });

    next();
  });

  router.use(express.urlencoded({ extended: true }));
  router.use(express.json());

  /** Rules of our API */
  router.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );

    if (req.method == "OPTIONS") {
      res.header(
        "Access-Control-Allow-Methods",
        "PUT, POST, PATCH, DELETE, GET"
      );
      return res.status(200).json({});
    }

    next();
  });

  /** Healthcheck */
  router.get("/ping", (req, res, next) =>
    res.status(200).json({ hello: "world" })
  );

  /** Error handling */
  router.use((req, res, next) => {
    const error = new Error("Not found");

    Logging.error(error);

    res.status(404).json({
      message: error.message,
    });
  });

  http.createServer(router).listen(config.server.port, () => {
    Logging.info(`Server is running on port ${config.server.port}`);
    timer.setInterval(function () {
      transactionUpdater();
      watchBitcoinTransactions();
    }, 10000);
  });
};

function main() {
  connectToDB();
}

main();

import { post } from "./utils/axios";
import { updateTransaction } from "./Database/controllers/Transactons";
import { Gateway, GatewayTransaction } from "@renproject/ren";
import {
  createTransaction,
  readTransaction,
  readAllTransaction,
} from "./Database/controllers/Transactons";
import { watchLatestTransactions } from "./ren/renTransactionFetcher";
import Logging from "./utils/logger";
import timer from "timers";
import { reconstructActiveGateway } from "./ren/renGatewayFetcher";
import { getCurrentGateway } from "./ren/renGatewayFetcher";
import { connectToDB } from "./Database/connection";
import { QUICKNODE_ADDRESS_LOOKUP_URL } from "./utils/emviornmentVariables";

const transactionUpdater = async () => {
  const transactions = await readAllTransaction();
  const txParams = transactions.map((tx: any) => {
    return {
      jsonrpc: "1.0",
      method: "getrawtransaction",
      params: [tx.fromChainTxid, 1],
    };
  });

  const transactionObjects = (await post(
    QUICKNODE_ADDRESS_LOOKUP_URL,
    txParams
  )) as any;

  if (transactionObjects.length > 0) {
    transactionObjects.forEach(async (tx: any, i: number) => {
      const { txid, txStatus, toAddress } = await watchLatestTransactions(
        transactions[i].fromChainTxid,
        transactions[i].renVMHash,
        transactions[i].toChainAddress
      );
      if (
        tx.result?.confirmations !== transactions[i].confirmations ||
        transactions[i].renVMHash === undefined ||
        txStatus !== transactions[i].status
      ) {
        console.log(tx.result?.confirmations, transactions[i].confirmations);
        console.log(transactions[i].renVMHash);
        console.log(txStatus, transactions[i].status);
        await updateTransaction(
          transactions[i].fromChainTxid,
          tx.result?.confirmations,
          tx.result?.time,
          txid,
          txStatus,
          toAddress,
          ""
        );
      }
    });
  } else Logging.info(`No update required`)
};

const getBitcoinBlockTime = async () => {
  const latestBlockHash = await post(QUICKNODE_ADDRESS_LOOKUP_URL, {
    jsonrpc: "1.0",
    method: "getbestblockhash",
    params: [],
  });

  const latestBlock = await post(QUICKNODE_ADDRESS_LOOKUP_URL, {
    jsonrpc: "1.0",
    method: "getblock",
    params: [latestBlockHash.result],
  });
  Logging.info(`Current Bitcoin blocktime is ${latestBlock.result.time}`);
  return latestBlock.result.time;
};

const isolateAddress = (tx: any, targetGateway: string) => {
  const hasBeenFound = tx?.result.vout[0]?.scriptPubKey?.address.find(
    (address: string) => address === targetGateway
  );
  return hasBeenFound;
};

const createEntry = async (
  tx: any,
  deposit: GatewayTransaction,
  gatewayAddress: string
) => {
  const doesTransactionExist = await readTransaction(tx?.result.txid);
  if (!doesTransactionExist) {
    createTransaction(
      deposit.fromChain.chain,
      tx?.result.txid,
      tx?.result.vout[1].scriptPubKey.address,
      deposit.toChain.chain,
      tx?.result.vout[0].value,
      gatewayAddress
    );
    Logging.info(`transaction has been added to the database`);
  }
};

//for existing gateways check btc tx individually
const watchBitcoinTransactions = async (
  deposit: GatewayTransaction,
  blocktime: number,
  gatewayAddress: string
) => {
  //when starting the tx watcher a gateway may already have previous transactions
  //terefore we only want to watch transactions after the bot has started.
  //ren gateway.on("deposit") will return all transactons for the gateway so
  //we will ignore the deposits found prior to when the bot starts and only watch transactions
  //that occur after
  Logging.info(`processing new batch`);
  const tx = (await post(QUICKNODE_ADDRESS_LOOKUP_URL, {
    jsonrpc: "1.0",
    method: "getrawtransaction",
    params: [deposit.params.fromTx.txHash, 1],
  })) as any;

  if (tx.result.time && tx.result.time <= blocktime) return;
  deposit.renVM.submit().catch(console.error);
  if (tx?.result) {
    if (Array.isArray(tx?.result.vout[0]?.scriptPubKey?.address)) {
      const found = isolateAddress(tx, gatewayAddress);
      if (found === gatewayAddress) createEntry(tx, deposit, gatewayAddress);
    } else if (tx?.result.vout[0].scriptPubKey.address === gatewayAddress) {
      createEntry(tx, deposit, gatewayAddress);
    } else Logging.info(`no new transactions found`);
  }
};

function main() {
  connectToDB().then(async () => {
    const blocktime = await getBitcoinBlockTime();
    const gatewayAddress = (await getCurrentGateway()) as string;
    const gatewayObject = (await reconstructActiveGateway(
      gatewayAddress as string
    )) as Gateway<any, any>;

    Logging.info(gatewayAddress)
    gatewayObject?.on("transaction", (deposit: GatewayTransaction<any>) =>
      watchBitcoinTransactions(deposit, blocktime, gatewayAddress)
    );
    timer.setInterval(function () {
      Logging.info(`attempting to update transaction`)
      transactionUpdater();
    }, 10000);
  });
}

main();

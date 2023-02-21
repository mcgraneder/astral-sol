import RenJS from "@renproject/ren";
import { utils, ContractChain } from "@renproject/utils";
import {
  RenVMCrossChainTransaction,
  ResponseQueryTx,
  RPCMethod,
  unmarshalRenVMTransaction,
  RenVMProvider,
} from "@renproject/provider";
import { Ethereum } from "@renproject/chains";
import {
  TransactionType,
  TransactionSummary,
  RenVMTransaction,
} from "../types/renTypes";
import { setUpChains, getContractChainParams } from "../chains/chainsSetup";
import BigNumber from "bignumber.js";
import { summarizeTransaction } from "./renTransactionFormatter";
import { Gateway } from "@renproject/ren";
import { TransactionParams } from "@renproject/ren//params";

export const unmarshalTransaction = async (
  response: ResponseQueryTx | { tx: ResponseQueryTx["tx"]; txStatus: undefined }
) => {
  const isMint = /((\/to)|(To))/.exec(response.tx.selector);
  const isBurn = /((\/from)|(From))/.exec(response.tx.selector);

  if (isMint || isBurn) {
    const unmarshalled = unmarshalRenVMTransaction(response.tx);
    return {
      result: { ...unmarshalled, status: response.txStatus },
      transactionType: TransactionType.Mint as const,
      summary: await summarizeTransaction(unmarshalled),
    };
  } else {
    throw new Error(`Unrecognised transaction type ${response.tx.selector}.`);
  }
};

export const queryMintOrBurn = async (
  provider: RenVMProvider,
  transactionHash: string
) => {
  let response: ResponseQueryTx;
  try {
    response = await provider.sendMessage(RPCMethod.QueryTx, {
      txHash: transactionHash,
    });
  } catch (error: any) {
    throw error;
  }

  // console.log(transactionHash);
  const unmarshalled = unmarshalRenVMTransaction(response.tx);
  return {
    result: unmarshalled,
    transactionType: TransactionType.Mint as const,
    summary: await summarizeTransaction(unmarshalled),
  };
};

export const queryTransaction = async (transaction: any, renJS: RenJS) => {
  if (!transaction.queryTx) {
    transaction.queryTx = (await queryMintOrBurn(
      renJS.provider,
      transaction.txHash
    )) as any;
  }

  return transaction;
};

const handleGatewayQuery = async (transactionAddress: string) => {
  let transaction = RenVMTransaction(transactionAddress);

  const { renJS } = setUpChains();

  const tx = await queryTransaction(transaction, renJS);
  const { gateway } = (await getToChainTx(
    renJS,
    tx.queryTx.result,
    tx.queryTx.summary
  )) as any;

  return gateway?.params.to.params.params[1].value;
  // console.log(gateway?.params.to.params.params[1].value);
  // console.log(gateway);
};

export const getToChainTx = async (
  renJS: RenJS,
  transactionParams: RenVMCrossChainTransaction,
  summary: TransactionSummary
) => {
  const inputs = transactionParams?.in as unknown as {
    amount: BigNumber;
    ghash: string;
    gpubkey: string;
    nhash: string;
    nonce: string;
    payload: string;
    phash: string;
    to: string;
    txid: string;
    txindex: string;
  };

  if (!summary.fromChain) {
    throw new Error(
      `Fetching transaction details not supported yet for ${summary.fromLabel}.`
    );
  }

  if (!summary.toChain) {
    throw new Error(
      `Fetching transaction details not supported yet for ${summary.toLabel}.`
    );
  }

  const txid = utils.toURLBase64(transactionParams.in.txid);
  const txParams: TransactionParams = {
    asset: summary.asset,
    fromTx: {
      asset: summary.asset,
      chain: summary.from,
      txid,
      explorerLink:
        (summary.fromChain &&
          summary.fromChain.transactionExplorerLink({ txid })) ||
        "",
      txHash: summary.fromChain.txHashFromBytes(transactionParams.in.txid),
      txindex: transactionParams.in.txindex.toFixed(),
      amount: transactionParams.in.amount.toFixed(),
    },
    shard: {
      gPubKey: utils.toURLBase64(transactionParams.in.gpubkey),
    },
    nonce: utils.toURLBase64(transactionParams.in.nonce),
    to: await getContractChainParams(
      summary.toChain as ContractChain,
      inputs.to,
      (inputs.payload as Uint8Array | string) instanceof Uint8Array
        ? utils.toHex(inputs.payload as unknown as Uint8Array)
        : inputs.payload,
      summary.asset
    ),
  };

  const deposit = await renJS.gatewayTransaction(txParams);

  try {
    await deposit.renVM.query();
  } catch (error) {
    console.error(error);
  }
  let gateway: Gateway | undefined;

  if (summary.fromChain) {
    gateway = await renJS.gateway({
      asset: txParams.asset,
      from: (summary.fromChain as Ethereum).Transaction({
        txid: utils.toURLBase64(transactionParams.in.txid),
        txindex: transactionParams.in.txindex.toFixed(),
      }),
      to: txParams.to,
    });
  }

  return {
    deposit,
    gateway,
  };
};

const updateUnknownTransaction = async (
  txs: any,
  renJS: RenJS,
  transactionId: string
) => {
  let txid;
  let txStatus;
  let toAddress;
  for (const tx of txs) {
    const response = await renJS.provider.sendMessage(RPCMethod.QueryTx, {
      txHash: tx.hash,
    });

    const renTx = await unmarshalTransaction({
      tx: response.tx,
      txStatus: response.txStatus,
    });

    console.log(renTx.summary.inTx?.txHash, transactionId);
    if (renTx.summary.inTx?.txHash === transactionId) {
      txid = renTx.result.hash;
      txStatus = response.txStatus;
      toAddress = await handleGatewayQuery(txid);
      break;
    }
  }
  return { txid, txStatus, toAddress };
};

const updateTransactionStatus = async (
  renJS: RenJS,
  txid: string,
  toAddress: string
) => {
  const response = await renJS.provider.sendMessage(RPCMethod.QueryTx, {
    txHash: txid,
  });
  const txStatus = response.txStatus;
  return { txid, txStatus, toAddress };
};

export async function watchLatestTransactions(
  transactionId: string,
  txhash: string,
  toAddress: string
) {
  const { renJS } = setUpChains();
  const { txs } = (await renJS.provider.sendMessage(
    "ren_queryTxs" as any as never,
    {
      latest: true,
      limit: "3",
    } as any as never
  )) as { txs: ResponseQueryTx["tx"][] };

  if (!txhash) return await updateUnknownTransaction(txs, renJS, transactionId);
  else return await updateTransactionStatus(renJS, txhash, toAddress);
}

import { RenVMCrossChainTransaction } from "@renproject/provider";
import { Gateway, GatewayTransaction } from "@renproject/ren";
import { ChainCommon, TxStatus } from "@renproject/utils";
import BigNumber from "bignumber.js";
// import { ConnectorConfig } from "@renproject/multiwallet-ui";
import { Chain, ContractChain, RenNetwork } from "@renproject/utils";

export enum ChainType {
  LockChain = "LockChain",
  EVMChain = "EVMChain",
  SolanaChain = "SolanaChain",
}

export interface ChainDetails<ChainClass extends Chain = Chain> {
  chain: string;
  chainPattern: RegExp;
  assets: { [asset: string]: string };
  type: ChainType;
  usePublicProvider: (network: RenNetwork) => ChainClass | null;
  getOutputParams?: (
    mintChain: Chain,
    to: string,
    payload: string,
    asset: string
  ) => Promise<any>;
  getTokenAccount?: (
    mintChain: ContractChain,
    asset: string
  ) => Promise<string | null>;
  createTokenAccount?: (
    mintChain: ContractChain,
    asset: string
  ) => Promise<string>;
}

interface QueryResultCommon {
  uuid: string;

  type: TransactionType;
  label: string;
  resultPath: string;
}

// Querying ////////////////////////////////////////////////////////////////////

export interface Querying extends QueryResultCommon {
  type: TransactionType;
  label: string;
  resultPath: string;
  QueryString: string;

  noResult?: boolean;
  errorQuerying?: Error;
  multipleResults?: QueryResult[];
}

/* eslint-disable @typescript-eslint/no-redeclare */
export const Querying = (
  QueryString: string,
  details?: Partial<Querying>
): Querying => ({
  uuid: "uuid()",
  type: TransactionType.Mint,
  QueryString,
  label: QueryString,
  resultPath: `/Query/${encodeURIComponent(QueryString)}`,
  ...details,
});

// RenVMTransaction ////////////////////////////////////////////////////////////

export enum RenVMTransactionError {
  TransactionNotFound = "transaction-not-found",
}

export interface TransactionSummary {
  asset: string;
  assetShort: string;
  assetLabel: string;

  from: string;
  fromLabel: string;
  fromLabelShort: string;
  fromChain?: ChainCommon;

  to: string;
  toLabel: string;
  toLabelShort: string;
  toChain?: ChainCommon;

  decimals?: number;
  amountIn?: BigNumber;
  amountInRaw?: BigNumber;

  amountOut?: BigNumber;
  amountOutRaw?: BigNumber;

  inTx?: {
    txHash: string;
    explorerLink: string;
  };
  outTx?: {
    txHash: string;
    explorerLink: string;
  };
}

export enum TransactionType {
  Mint = "mint",
  Burn = "burn",
  ClaimFees = "claimFees",
}

export type SummarizedTransaction =
  | {
      result: RenVMCrossChainTransaction & { status?: TxStatus };
      summary: TransactionSummary;
      transactionType: TransactionType.Mint;
    }
  | {
      result: any;
      summary: TransactionSummary;
      transactionType: TransactionType.ClaimFees;
    };

export interface RenVMTransaction extends QueryResultCommon {
  type: TransactionType;
  label: string;
  resultPath: string;
  txHash: string;
  queryTx?: SummarizedTransaction | Error;
  deposit?: GatewayTransaction;
}

export const RenVMTransaction = (
  transactionHash: string,
  queryTx?: SummarizedTransaction | Error,
  deposit?: GatewayTransaction
): RenVMTransaction => {
  return {
    uuid: "uuid()",
    type: TransactionType.Mint,
    label: transactionHash,
    resultPath: `/tx/${encodeURIComponent(transactionHash)}`,
    txHash: transactionHash,
    queryTx,
    deposit,
  };
};

// // RenVMGateway ////////////////////////////////////////////////////////////

export interface RenVMGateway extends QueryResultCommon {
  type: TransactionType;
  label: string;
  resultPath: string;
  address: string;
  queryGateway?: {
    result: RenVMCrossChainTransaction;
    transactionType: TransactionType.Mint;
    summary: TransactionSummary;
  };
  lockAndMint?: Gateway;
}

export const RenVMGateway = (
  address: string,
  queryGateway?: {
    result: RenVMCrossChainTransaction;
    transactionType: TransactionType.Mint;
    summary: TransactionSummary;
  },
  lockAndMint?: Gateway
): RenVMGateway => {
  return {
    uuid: "uuid()",
    type: TransactionType.Mint,
    label: address,
    resultPath: `/gateway/${encodeURIComponent(address)}`,
    address,
    queryGateway,
    lockAndMint,
  };
};

////////////////////////////////////////////////////////////////////////////////

export type QueryResult = Querying | RenVMTransaction | RenVMGateway;

import mongoose, { Document, Schema } from "mongoose";

export interface ITransaction {
  fromChain: string;
  fromChainTxid: string;
  fromChainAddress: string;
  toChain: string;
  toChainTxid: string;
  toChainAddress: string;
  amount: string;
  time: number;
  confirmations: number;
  status: string;
  renVMHash: string;
  gatewayAddress: string;
}

export interface ITransactionModel extends ITransaction, Document {}

const TransactionsSchema: Schema = new Schema(
  {
    fromChain: { type: String, required: true },
    fromChainTxid: { type: String, required: true },
    fromChainAddress: { type: String, required: true },
    toChain: { type: String, required: true },
    toChainTxid: { type: String, required: false },
    toChainAddress: { type: String, required: false },
    amount: { type: String, required: true },
    time: { type: Number, required: false },
    confirmations: { type: Number, required: false },
    status: { type: String, required: false },
    renVMHash: { type: String, required: false },
    gatewayAddress: { type: String, required: true },
  },
  {
    versionKey: false,
  }
);

export default mongoose.model<ITransactionModel>("Transactions", TransactionsSchema);

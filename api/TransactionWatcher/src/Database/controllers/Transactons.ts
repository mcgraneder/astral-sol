import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import Transactions from "../models/Transactions";

export const createTransaction = (
  fromChain: string,
  fromChainTxid: string,
  fromChainAddress: string,
  toChain: string,
  amount: string,
  gatewayAddress: string
) => {
  const transaction = new Transactions({
    _id: new mongoose.Types.ObjectId(),
    fromChain,
    fromChainTxid,
    fromChainAddress: "undefined",
    toChain,
    toChainTxid: undefined,
    toChainAddress: undefined,
    amount,
    time: 0,
    confirmations: 0,
    status: "unconfirmed",
    renVMHash: undefined,
    gatewayAddress,
  });

  console.log(transaction);

  transaction
    .save()
    .then((transaction) => console.log("success", transaction))
    .catch((error) => {
      console.error(error);
    });
};
export const readTransaction = async (transactionId: string) => {
  console.log(transactionId);
  const transaction = Transactions.findOne({ fromChainTxid: transactionId });

  return transaction;
  //   console.log(user)
};
export const readAllTransaction = async () => {
  const transactions = await Transactions.find({
    confirmations: { $lt: 7 },
  });

  return transactions;
};
export const updateTransaction = async (
  transactionId: string,
  newConfirmations: number,
  time: number,
  renVMHash: string | undefined,
  status: string | undefined,
  toChainAddress: string | undefined,
  toChainTxid: string | undefined
) => {
  await Transactions.updateOne(
    { fromChainTxid: transactionId },
    {
      confirmations: newConfirmations,
      time: time,
      renVMHash: renVMHash,
      status: status,
      toChainAddress: toChainAddress,
      toChainTxid: toChainTxid,
    }
  ).then((result: any) => console.log(result));
};
export const deleteTransaction = () => {
  //   return Transactions.findByIdAndDelete(transactionId).then((transaction) =>
  //     transaction
  //       ? res.status(201).json({ message: "deleted" })
  //       : res.status(404).json({ message: "Not found" })
  //   );

  return Transactions.deleteMany({}).then(() => console.log("success"));
};

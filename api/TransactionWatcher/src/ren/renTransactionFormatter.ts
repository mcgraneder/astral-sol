import { RenNetwork } from "@renproject/utils";
import { RenVMCrossChainTransaction } from "@renproject/provider";
import { Bitcoin, Catalog } from "@renproject/chains";
import BigNumber from "bignumber.js";
import { parseV2Selector } from "./renUtils";
import { NETWORK } from "../utils/emviornmentVariables";

export const summarizeTransaction = async (
  transactionDetails: RenVMCrossChainTransaction
) => {
  let { to, from, asset } = parseV2Selector(transactionDetails.selector);
  // let { to, from, asset } = parseV2Selector(transactionDetails.selector);
  const bitcoin = await new Bitcoin({ network: NETWORK });
  const catalog = new Catalog({
    network: NETWORK,
    provider: Catalog.configMap[NETWORK]!.config.rpcUrls[0],
  });
  const fromChain = bitcoin;
  from = fromChain ? fromChain.chain : from;
  const toChain = catalog;
  to = toChain ? toChain.chain : to;

  // console.log(fromChain, toChain);

  let amountInRaw: BigNumber | undefined;
  let amountIn: BigNumber | undefined;
  let amountOutRaw: BigNumber | undefined;
  let amountOut: BigNumber | undefined;
  let decimals: number | undefined;

  if (
    (transactionDetails.in as any).amount &&
    !(transactionDetails.in as any).amount.isNaN()
  ) {
    amountInRaw = new BigNumber((transactionDetails.in as any).amount);
  }

  let chain;
  if (fromChain && (await fromChain.isLockAsset(asset))) {
    chain = fromChain;
  } else {
    chain = toChain;
  }

  try {
    if (amountInRaw && chain) {
      decimals = await chain.assetDecimals(asset);
      amountIn = amountInRaw.shiftedBy(-decimals);
      if (
        transactionDetails.out &&
        (transactionDetails.out.revert === undefined ||
          transactionDetails.out.revert.length === 0) &&
        (transactionDetails.out as any).amount
      ) {
        amountOutRaw = new BigNumber((transactionDetails.out as any).amount);
        amountOut = amountOutRaw.shiftedBy(-decimals);
      }
    }
  } catch (error) {
    console.error(error);
  }
  // console.log("searcj", transactionDetails.out?.txid)

  let outTx:
    | {
        txHash: string;
      }
    | undefined;
  if (toChain && transactionDetails.out && transactionDetails.out.txid?.length > 0) {
    const outTxHash = toChain.txHashFromBytes(transactionDetails.out?.txid);
    outTx = {
      txHash: outTxHash,
    };
  }

  let inTx:
    | {
        txHash: string;
      }
    | undefined;
  if (
    fromChain &&
    transactionDetails.in?.txid &&
    transactionDetails.in?.txid.length > 0
  ) {
    const inTxHash = fromChain.txHashFromBytes(transactionDetails.in?.txid);
    inTx = {
      txHash: inTxHash,
    };
  }

  return {
    asset,
    to,
    toChain: toChain || undefined,
    from,
    fromChain: fromChain || undefined,
    decimals,
    amountIn,
    amountInRaw,
    amountOut,
    amountOutRaw,
    outTx,
    inTx,
  };
};

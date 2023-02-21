import RenJS from "@renproject/ren";
import { RenNetwork, ContractChain, utils } from "@renproject/utils";
import {
  RenVMCrossChainTransaction,
  ResponseQueryTx,
  unmarshalRenVMTransaction,
  RenVMProvider,
} from "@renproject/provider";
import { Bitcoin, Catalog } from "@renproject/chains";
import { TransactionSummary } from "../types/renTypes";
import { RenVMGateway } from "../types/renTypes";
import { GatewayParams } from "@renproject/ren//params";
import { getContractChainParams, setUpChains, getCatalogInitalGateway } from '../chains/chainsSetup';
import { parseV2Selector } from "./renUtils";
import { TransactionType } from "../chains/chainsSetup";
import { NETWORK } from '../utils/emviornmentVariables';

export const getCurrentGateway = async () => {
  const asset = "BTC";
  const { network, ethereum, bitcoin: fromChain } = setUpChains();
  const renJS = await new RenJS(network).withChains(ethereum, fromChain);
  const gateway = await renJS.gateway({
    asset,
    from: fromChain.GatewayAddress(),
    to: getCatalogInitalGateway(),
  });

  return gateway.gatewayAddress;
};

export const summarizeTransaction = async (
  gatewayParams: RenVMCrossChainTransaction
) => {
  let { to, from, asset } = parseV2Selector(gatewayParams.selector);
  const bitcoin = await new Bitcoin({ network: NETWORK });
  const catalog = new Catalog({
    network: NETWORK,
    provider: Catalog.configMap[NETWORK]!.config.rpcUrls[0],
  });
  const fromChain = bitcoin;
  from = fromChain ? fromChain.chain : from;
  const toChain = catalog;
  to = toChain ? toChain.chain : to;

  let chain;
  if (fromChain && (await fromChain.isLockAsset(asset))) {
    chain = fromChain;
  } else {
    chain = toChain;
  }

  return {
    asset,
    to,
    toChain: toChain || undefined,
    from,
    fromChain: fromChain || undefined,
  };
};

export const queryGateway = async (
  provider: RenVMProvider,
  gatewayAddress: string
): Promise<{
  result: any;
  transactionType: TransactionType.Mint;
  summary: any;
}> => {
  let response: ResponseQueryTx;
  try {
    response = await provider.sendMessage(
      "ren_queryGateway" as any,
      { gateway: gatewayAddress },
      1
    );
  } catch (error: any) {
    console.error(error);
    throw error;
  }
  const unmarshalled = unmarshalRenVMTransaction(response.tx);
  return {
    result: unmarshalled,
    transactionType: TransactionType.Mint as const,
    summary: await summarizeTransaction(unmarshalled),
  };
};

export const searchGateway = async (
  gateway: RenVMGateway,
  renJS: RenJS
): Promise<RenVMGateway | null> => {
  if (!gateway.queryGateway) {
    gateway.queryGateway = await queryGateway(renJS.provider, gateway.address);
  }
  return gateway;
};

export const getGatewayInstance = async (
  renJS: RenJS,
  gatewayParams: RenVMCrossChainTransaction,
  summary: TransactionSummary
) => {
  const params: GatewayParams = {
    asset: summary.asset,
    from: summary.fromChain,
    to: await getContractChainParams(
      summary.toChain as ContractChain,
      gatewayParams.in?.to,
      (gatewayParams.in?.payload as any)
        ? (utils.toHex(gatewayParams.in?.payload) as any)
        : gatewayParams.in?.payload,
      summary.asset
    ),
    nonce: gatewayParams.in?.nonce as any,
    shard: {
      gPubKey: utils.toBase64(gatewayParams.in.gpubkey),
    },
  };

  const gatewayInstance = await renJS.gateway(params);
  return gatewayInstance;
};

export const reconstructActiveGateway = async (gatewayAddress: string) => {
  const { renJS } = setUpChains();

  let gateway: RenVMGateway = RenVMGateway(gatewayAddress);
  gateway = (await searchGateway(gateway, renJS)) as RenVMGateway;

  const queryGateway =
    gateway && !(gateway instanceof Error) && gateway.queryGateway;

  if (
    queryGateway &&
    !(queryGateway instanceof Error) &&
    queryGateway.transactionType === TransactionType.Mint
  ) {
    const deposit = await getGatewayInstance(
      renJS,
      queryGateway.result,
      queryGateway.summary
    );

    return deposit;
  }
};

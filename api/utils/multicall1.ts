import { ERC20ABI } from "@renproject/chains-ethereum/contracts";
import { MultiCallService } from "@1inch/multicall";
import { Web3ProviderConnector } from "@1inch/multicall/connector";
import { chainsBaseConfig } from "../constant/constants";
import BridgeABI from "../../utils/ABIs/BridgeABI.json";
import TestBridgeABI from "../../utils/ABIs/TestBridgeABI.json";

import { MultiCallParams } from "@1inch/multicall/model";
import { Chain } from "@renproject/chains";
import Web3 from "web3";
import { PorividerConfig } from "../constant/networks";
import { EVMChains } from "../constant/chainUtils";

export type MulticallConfig = {
  chain: Chain;
  multicallService: MultiCallService;
  multicallProvider: Web3ProviderConnector;
  assets: Asset[],
  tickers: string[],
};

export type MulticallSetupConfig = {
  multicallConfigMap: {
    [chain: string]: MulticallConfig;
  };
  combinedConfigs: MulticallConfig[];
};

type Asset = {
  tokenAddress: string;
  mintGatewayAddress: string;
};

const getMulticallConfig = (chain: Chain): MulticallConfig => {
  const chainProvider = new Web3(
    new Web3.providers.HttpProvider(PorividerConfig[chain].url)
  ) as any;

  const multicallProvider = new Web3ProviderConnector(chainProvider);
  const multicallService = new MultiCallService(
    multicallProvider,
    chainsBaseConfig[chain].multicallContract
  );
  const multicallConfig: MulticallConfig = {
    chain: chain,
    multicallService,
    multicallProvider,
    assets: Object.values(chainsBaseConfig[chain].assets),
    tickers: Object.keys(chainsBaseConfig[chain].assets),
  };
  return multicallConfig;
};
export const setupMulticallConfig = (): MulticallSetupConfig => {
  let multicallConfigMap = {} as { [chain: string]: MulticallConfig };
  const combinedConfigs = EVMChains.map((chain: Chain) => {
    multicallConfigMap[chain] = getMulticallConfig(chain);
    return multicallConfigMap[chain];
  });

  return { multicallConfigMap, combinedConfigs };
};
export default async function TokenMulticall1(
  combinedConfig: MulticallConfig[],  
  of: string,
) {
  // The parameters are optional, if not specified, the default will be used
  const params: MultiCallParams = {
    chunkSize: 10,
    retriesLimit: 3,
    blockNumber: "latest",
  };

  const WalletBalancePromises: any = [];
  combinedConfig.forEach(async (config: MulticallConfig) => {
    WalletBalancePromises.push(
      config.multicallService.callByChunks(
        config.assets.map((asset: Asset) => {
          return {
            to: asset.tokenAddress,
            data: config.multicallProvider.contractEncodeABI(
              ERC20ABI,
              asset.tokenAddress,
              "balanceOf",
              [of]
            ),
          };
        }),
        params
      )
    );
  });

  const BridgeBalancePromises: any = [];
  combinedConfig.forEach(async (config: MulticallConfig) => {
    const func =
      config.chain === "Ethereum" || config.chain === "BinanceSmartChain"
        ? "getContractTokenbalance"
        : "getUserbalanceInContract";
    const ABI =
      config.chain === "Ethereum" || config.chain === "BinanceSmartChain"
        ? TestBridgeABI
        : BridgeABI;

    BridgeBalancePromises.push(
      config.multicallService.callByChunks(
        config.assets.map((asset: Asset) => {
          return {
            to: chainsBaseConfig[config.chain].bridgeAddress,
            data: config.multicallProvider.contractEncodeABI(
              ABI,
              chainsBaseConfig[config.chain].bridgeAddress,
              func,
              [asset.tokenAddress, of]
            ),
          };
        }),
        params
      )
    );
  });

  const walletTokenBalances = await Promise.all(WalletBalancePromises) as string[][];
  const bridgeTokenBalances = (await Promise.all(
    BridgeBalancePromises
  )) as string[][];

  return { walletTokenBalances, bridgeTokenBalances }

}

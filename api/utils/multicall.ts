import { ERC20ABI } from "@renproject/chains-ethereum/contracts";
import { MultiCallService } from "@1inch/multicall";
import { Web3ProviderConnector } from "@1inch/multicall/connector";
import { chainsBaseConfig } from "../constant/constants";
import BridgeABI from "../../utils/ABIs/BridgeABI.json";
import TestBridgeABI from "../../utils/ABIs/TestBridgeABI.json";

import { MultiCallParams } from "@1inch/multicall/model";

type Asset = {
  tokenAddress: string;
  mintGatewayAddress: string;
};
export default async function TokenMulticall(
  MulticallService: MultiCallService,
  MulticallProvider: Web3ProviderConnector,
  chainName: string,
  of: string,
  assets: Asset[]
) {
  // The parameters are optional, if not specified, the default will be used
  const params: MultiCallParams = {
    chunkSize: 10,
    retriesLimit: 3,
    blockNumber: "latest",
  };

  // const add =
  //   chainName === "Ethereum"
  //     ? "0x30774f9B5d010E8891625c487fC23f2dbBd5925E"
  //     : chainsBaseConfig[chainName].bridgeAddress;
  const func = chainName === "Ethereum" ? "getContractTokenbalance" : "getUserbalanceInContract"
  const ABI = chainName === "Ethereum" ? TestBridgeABI : BridgeABI;

  console.log(chainName)
  const promises: string[][] = [
    await MulticallService.callByChunks(
      assets.map((asset: Asset) => {
        return {
          to: chainsBaseConfig[chainName].bridgeAddress,
          data: MulticallProvider.contractEncodeABI(
            ABI,
            chainsBaseConfig[chainName].bridgeAddress,
            func,
            [asset.tokenAddress, of]
          ),
        };
      }),
      params
    ),
    await MulticallService.callByChunks(
      assets.map((asset: Asset) => {
        return {
          to: asset.tokenAddress,
          data: MulticallProvider.contractEncodeABI(
            ERC20ABI,
            asset.tokenAddress,
            "balanceOf",
            [of]
          ),
        };
      }),
      params
    ),
  ];

  const [bridgeTokenBalances, walletTokenBalances] = await Promise.all(
    promises
  );

  return { bridgeTokenBalances, walletTokenBalances };
}

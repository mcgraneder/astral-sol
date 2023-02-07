import { ERC20ABI } from "@renproject/chains-ethereum/contracts";
import { MultiCallService } from "@1inch/multicall";
import { Web3ProviderConnector } from "@1inch/multicall/connector";
import { ChainBaseConfig } from "../constant/constants";
import BridgeABI from "../../utils/ABIs/BridgeABI.json"

type Asset = {
    tokenAddress: string;
    mintGatewayAddress: string
}
export default async function TokenMulticall(
  ethereumMulticallService: MultiCallService,
  ethereumMulticallProvider: Web3ProviderConnector,
  of: string,
  to: string,
  assets: Asset[],
  params: any,
) {
  const promises: string[][] = [
    await ethereumMulticallService.callByChunks(
      assets.map((asset: Asset) => {
        return {
          to: to,
          data: ethereumMulticallProvider.contractEncodeABI(
            BridgeABI, to, "getUserbalanceInContract", [asset.tokenAddress, of]
        ),
        };
      }),
      params
    ),
    await ethereumMulticallService.callByChunks(
      assets.map((asset: Asset) => {
        return {
          to: asset.tokenAddress,
          data: ethereumMulticallProvider.contractEncodeABI(
            ERC20ABI, asset.tokenAddress, "balanceOf", [of]
        ),
        };
      }),
      params
    ),
  ];

  const [bridgeTokenBalances, walletTokenBalances] = await Promise.all(promises);

  return { bridgeTokenBalances, walletTokenBalances };
}

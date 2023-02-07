import { TokenInfo } from "../../conf/constants";
import { ERC20ABI } from "@renproject/chains-ethereum/contracts";
import { MultiCallService } from "@1inch/multicall";
import { Web3ProviderConnector } from "@1inch/multicall/connector";
import { contractAddresses } from "../../util/bl/buildRouteUtils";
import { RenNetwork } from "@renproject/utils";

export default async function TokenMulticall(
  ethereumMulticallService: MultiCallService,
  ethereumMulticallProvider: Web3ProviderConnector,
  bscMulticallService: MultiCallService,
  bscMulticallProvider: Web3ProviderConnector,
  of: string,
  tokens: { [chain: string]: TokenInfo[] },
  params: any,
  network: RenNetwork
) {
  const promises: string[][] = [
    await ethereumMulticallService.callByChunks(
      tokens["Ethereum"].map((token: TokenInfo) => {
        return {
          to: token.address,
          data: ethereumMulticallProvider.contractEncodeABI(ERC20ABI, token.address, "balanceOf", [of]),
        };
      }),
      params
    ),
    await ethereumMulticallService.callByChunks(
      tokens["Ethereum"].map((token: TokenInfo) => {
        return {
          to: token.address,
          data: ethereumMulticallProvider.contractEncodeABI(ERC20ABI, token.address, "allowance", [
            of,
            "0x1cDE5506992E72b222Aa9EdF3709ffEd4c490eEA",
          ]),
        };
      }),
      params
    ),
    await bscMulticallService.callByChunks(
    tokens["BinanceSmartChain"].map((token: TokenInfo) => {
      return {
        to: token.address,
        data: bscMulticallProvider.contractEncodeABI(ERC20ABI, token.address, "balanceOf", [of]),
      };
      }),
    params
    ),
    await bscMulticallService.callByChunks(
    tokens["BinanceSmartChain"].map((token: TokenInfo) => {
      return {
        to: token.address,
        data: bscMulticallProvider.contractEncodeABI(ERC20ABI, token.address, "allowance", [
          of,
          "0xC8751601c2897e7e0AE498288f2E7644AcC1Ce67",
        ]),
      };
      }),
    params
    ),
  ];

  const [
    ethereumBalances,
    ethereumAllowances,
    bscBalances,
    bscAllowances
  ] = await Promise.all(promises);

  return { ethereumBalances, ethereumAllowances, bscBalances, bscAllowances };
}

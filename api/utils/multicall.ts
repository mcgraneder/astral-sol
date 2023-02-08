import { ERC20ABI } from "@renproject/chains-ethereum/contracts";
import { MultiCallService } from "@1inch/multicall";
import { Web3ProviderConnector } from "@1inch/multicall/connector";
import { chainsBaseConfig } from "../constant/constants";
import BridgeABI from "../../utils/ABIs/BridgeABI.json";
import Web3 from "web3";
import { PorividerConfig } from "../constant/networks";
import { MultiCallParams } from "@1inch/multicall/model";

let MulticallService: MultiCallService;
let chainProvider: any;
let MulticallProvider: Web3ProviderConnector;

type Asset = {
  tokenAddress: string;
  mintGatewayAddress: string;
};
export default async function TokenMulticall(
  chainName: string,
  of: string,
  assets: Asset[]
) {
  chainProvider = new Web3(
    new Web3.providers.HttpProvider(PorividerConfig[chainName].url)
  );

  MulticallProvider = new Web3ProviderConnector(chainProvider);
  MulticallService = new MultiCallService(
    MulticallProvider,
    chainsBaseConfig[chainName].multicallContract
  );

  // The parameters are optional, if not specified, the default will be used
  const params: MultiCallParams = {
    chunkSize: 10,
    retriesLimit: 3,
    blockNumber: "latest",
  };

  const promises: string[][] = [
    await MulticallService.callByChunks(
      assets.map((asset: Asset) => {
        return {
          to: chainsBaseConfig[chainName].bridgeAddress,
          data: MulticallProvider.contractEncodeABI(
            BridgeABI,
            chainsBaseConfig[chainName].bridgeAddress,
            "getUserbalanceInContract",
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

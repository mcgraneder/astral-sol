import { Arbitrum, Avalanche, BinanceSmartChain, Ethereum, Fantom, Kava, Moonbeam, Optimism, Polygon } from '@renproject/chains-ethereum';
import { Chain, Asset } from "@renproject/chains"
import { BridgeDeployments } from '../../utils/deployments';

type AssetBaseConfig = {
    [asset: string]: string
}
type ChainBaseConfig = {
    bridgeAddress: string;
    multicallContract: string
    chain: Chain
    // assets: AssetBaseConfig
}
export const chainsBaseConfig: { [chain: string]: ChainBaseConfig } = {
  [Arbitrum.chain]: {
    bridgeAddress: BridgeDeployments[Arbitrum.chain],
    multicallContract: "",
    chain: Chain.Arbitrum,
    // assets: {
    //     [Asset.BTC]: "hello"
    // }
  },
  [Avalanche.chain]: {
    bridgeAddress: BridgeDeployments[Avalanche.chain],
    multicallContract: "",
    chain: Chain.Avalanche
  },
  [BinanceSmartChain.chain]: {
    bridgeAddress: BridgeDeployments[BinanceSmartChain.chain],
    multicallContract: "",
    chain: Chain.BinanceSmartChain
  },
  [Ethereum.chain]: {
    bridgeAddress: BridgeDeployments[Ethereum.chain],
    multicallContract: "",
    chain: Chain.Ethereum
  },
  [Fantom.chain]: {
    bridgeAddress: BridgeDeployments[Fantom.chain],
    multicallContract: "",
    chain: Chain.Fantom
  },
  [Kava.chain]: {
    bridgeAddress: BridgeDeployments[Kava.chain],
    multicallContract: "",
    chain: Chain.Kava
  },
  [Moonbeam.chain]: {
    bridgeAddress: BridgeDeployments[Moonbeam.chain],
    multicallContract: "",
    chain: Chain.Moonbeam
  },
  [Optimism.chain]: {
    bridgeAddress: BridgeDeployments[Optimism.chain],
    multicallContract: "",
    chain: Chain.Optimism
  },
  [Polygon.chain]: {
    bridgeAddress: BridgeDeployments[Polygon.chain],
    multicallContract: "",
    chain: Chain.Polygon
  },
};

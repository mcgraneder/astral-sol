import { Chain } from "@renproject/chains";

export const EVMChains: Chain[] = [
  Chain.Ethereum,
  //   Chain.Arbitrum,  //multicall not supported for now
  //   Chain.Avalanche,  //multicall not supported for now
  Chain.Polygon,
  //   Chain.Optimism,  //multicall not supported for now
  Chain.Kava,
  Chain.Moonbeam,
  Chain.BinanceSmartChain,
  Chain.Fantom,
];

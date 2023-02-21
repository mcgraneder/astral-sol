import { Bitcoin } from "@renproject/chains";
import { Chain, RenNetwork } from "@renproject/utils";

import { ChainDetails, ChainType } from "../types/renTypes";

export const BitcoinDetails: ChainDetails<Bitcoin> = {
  chain: Bitcoin.chain,
  assets: Bitcoin.assets,
  chainPattern: /^(bitcoin|btc)$/i,
  type: ChainType.LockChain,
  usePublicProvider: (network: RenNetwork) => new Bitcoin({ network }),
  getOutputParams: async (
    mintChain: Chain,
    to: string,
    payload: string,
    asset: string
  ): Promise<any> => {
    return (mintChain as Bitcoin).Address(to);
  },
};






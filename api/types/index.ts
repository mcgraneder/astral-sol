import { Chain, Asset } from '@renproject/chains';

export type MulticallReturn = {
    tokenAddress: string;
    chain: Chain;
    asset: Asset;
    walletBalance: string;
    bridgeBalance: string;
}

export type MulticallAsset = {
    tokenAddress: string;
    mintGatewayAddress: string
}
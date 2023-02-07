import { Chain } from '@renproject/utils';
import { Ethereum, Polygon, BinanceSmartChain, Moonbeam, Fantom, Avalanche, Optimism, Kava, Arbitrum } from '@renproject/chains-ethereum';

export const BridgeDeployments: {[x: string]: string } = {
    [Ethereum.chain]: "0x2ae161bb1bAB667822834C99AF2EE7479a1083D3",
    [BinanceSmartChain.chain]: "0xa36E9D4B7D00875588A3B00cEb46cE6DB34D6A72",
    [Polygon.chain]: "0xa36E9D4B7D00875588A3B00cEb46cE6DB34D6A72",
    [Moonbeam.chain]: "0xa36E9D4B7D00875588A3B00cEb46cE6DB34D6A72",
    [Optimism.chain]: "0xa36E9D4B7D00875588A3B00cEb46cE6DB34D6A72",
    [Fantom.chain]: "0xa36E9D4B7D00875588A3B00cEb46cE6DB34D6A72",
    [Avalanche.chain]: "0xa36E9D4B7D00875588A3B00cEb46cE6DB34D6A72",
    [Arbitrum.chain]: "0xa36E9D4B7D00875588A3B00cEb46cE6DB34D6A72",
    [Kava.chain]: "0xa36E9D4B7D00875588A3B00cEb46cE6DB34D6A72",


}
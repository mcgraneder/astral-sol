import { Chain } from '@renproject/utils';
import { Ethereum, Polygon, BinanceSmartChain, Moonbeam, Fantom, Avalanche, Optimism, Kava, Arbitrum } from '@renproject/chains-ethereum';

export const BridgeDeployments: { [x: string]: string } = {
  [Ethereum.chain]: "0x9dFFd9DA32975f0955e3EfB62669aC167376d8AA",
  [BinanceSmartChain.chain]: "0x0E245bF0dca306eac0a666001de3862E895acbd7",
  [Polygon.chain]: "0x0E245bF0dca306eac0a666001de3862E895acbd7",
  [Moonbeam.chain]: "0x0E245bF0dca306eac0a666001de3862E895acbd7",
  [Optimism.chain]: "0x0E245bF0dca306eac0a666001de3862E895acbd7",
  [Fantom.chain]: "0x873A58355f85943227bdAC9750700456C767A905",
  [Avalanche.chain]: "0xa36E9D4B7D00875588A3B00cEb46cE6DB34D6A72",
  [Arbitrum.chain]: "0x873A58355f85943227bdAC9750700456C767A905",
  [Kava.chain]: "0x0E245bF0dca306eac0a666001de3862E895acbd7",
};

export const MulticallDeployments: { [x: string]: string } = {
  [Ethereum.chain]: "0x57B249fCF4b71c0c1E3f51fE25bC358ae6705b79",
  [BinanceSmartChain.chain]: "0x442576f76F190FEbbCd83C3f4A879aC27675C923",
  [Polygon.chain]: "0x442576f76F190FEbbCd83C3f4A879aC27675C923",
  [Moonbeam.chain]: "0x442576f76F190FEbbCd83C3f4A879aC27675C923",
  [Optimism.chain]: "0x873A58355f85943227bdAC9750700456C767A905",
  [Fantom.chain]: "0x442576f76F190FEbbCd83C3f4A879aC27675C923",
  [Avalanche.chain]: "0x442576f76F190FEbbCd83C3f4A879aC27675C923",
  [Arbitrum.chain]: "0x311FBDa0DC866AcC433Cb1C98253aa9569821916",
  [Kava.chain]: "0x442576f76F190FEbbCd83C3f4A879aC27675C923",
};

export const BridgeDeployments2: { [x: string]: string } = {
  [Ethereum.chain]: "0x9dFFd9DA32975f0955e3EfB62669aC167376d8AA",
  [BinanceSmartChain.chain]: "0x0E245bF0dca306eac0a666001de3862E895acbd7",
  // [Polygon.chain]: "0x0E245bF0dca306eac0a666001de3862E895acbd7",
  // [Moonbeam.chain]: "0x0E245bF0dca306eac0a666001de3862E895acbd7",
  // [Optimism.chain]: "0xa36E9D4B7D00875588A3B00cEb46cE6DB34D6A72",
  // [Fantom.chain]: "0x0E245bF0dca306eac0a666001de3862E895acbd7",
  // [Avalanche.chain]: "0xa36E9D4B7D00875588A3B00cEb46cE6DB34D6A72",
  // [Arbitrum.chain]: "0x0E245bF0dca306eac0a666001de3862E895acbd7",
  // [Kava.chain]: "0x0E245bF0dca306eac0a666001de3862E895acbd7",
};
// import { BinanceSmartChain, Ethereum } from "@renproject/chains-ethereum";

// export type BridgeAsset = {
//   tokenAddress: string;
//   bridgeAddress: string;
// };

// export enum Chains  {
//   Ethereum = "Ethereum",
//   BinanceSmartChain = "BinanceSmartChain"
// }

// export const testNativeAssetDeployments: {
//   [chain in Chains]: { [asset: string]: string };
// } = {
//   [Ethereum.chain]: {
//     ["USDT"]: "0x19b0D17988a4DeEa39e79E739777e6616cA1f9CD",
//   },
//   [BinanceSmartChain.chain]: {
//     ["USDT"]: "0xED912bC1FC1f44fC8Ff531880b149E19b1c35BfC",
//   },
// };

// export const registries: { [chain: string]: string } = {
//   [Ethereum.chain]: "0x409c4cdf5cB035d0e6692633A793BeC6396c9215",
//   [BinanceSmartChain.chain]: "0x7F31477f308e96dAB9B76D534F51E7bEAa06A5aB",
// };

// export const BridgeFactory: { [chain: string]: string } = {
//   [Ethereum.chain]: "0x9B26CB2f298FDa5F9A9D1E1410eB90c080c46d01",
//   [BinanceSmartChain.chain]: "0xed85e7bfDAFe48f31b7a2F71930e94E46504Bf0E",
// };

// export const BridgeAssets: {
//   [chain in Chains]: { [asset: string]: BridgeAsset };
// } = {
//   [Ethereum.chain]: {
//     ["aUSDT"]: {
//       tokenAddress: "0xf8f405c3297B1715a984d285a631e22835aFA626",
//       bridgeAddress: "0x467BDe104cd13f7769f2D1c0530aFF3A8fc247d4",
//     },
//   },
//   [BinanceSmartChain.chain]: {
//     ["aUSDT"]: {
//       tokenAddress: "0xEf8525d62713CB58638DB331553FCf7ed84F6B49",
//       bridgeAddress: "0xDBDaC61e337d25d516DC67CB17C54a832A4E1363",
//     },
//   },
// };


import { BinanceSmartChain, Ethereum } from "@renproject/chains-ethereum";

export type BridgeAsset = {
  tokenAddress: string;
  bridgeAddress: string;
};

export enum Chains {
  Ethereum = "Ethereum",
  BinanceSmartChain = "BinanceSmartChain",
}

export const testNativeAssetDeployments: {
  [chain in Chains]: { [asset: string]: string };
} = {
  [Ethereum.chain]: {
    ["USDT"]: "0x270203070650134837F3C33Fa7D97DC456eF624e",
  },
  [BinanceSmartChain.chain]: {
    ["USDT"]: "0xED912bC1FC1f44fC8Ff531880b149E19b1c35BfC",
  },
};

export const registries: { [chain: string]: string } = {
  [Ethereum.chain]: "0xDEB2be610258902505AbD7c41724b592261C8c05",
  [BinanceSmartChain.chain]: "0xeDE6D6861B26cbeDACd487A31E2E236065fB97dA",
};

export const BridgeFactory: { [chain: string]: string } = {
  [Ethereum.chain]: "0x77Fee29643b20571B25c2B1BA40D29dEFe3ec143",
  [BinanceSmartChain.chain]: "0x754D39d9178C59549D2734330451A88eD909a310",
};

export const BridgeAssets: {
  [chain in Chains]: { [asset: string]: BridgeAsset };
} = {
  [Ethereum.chain]: {
    ["aUSDT"]: {
      tokenAddress: "0xb7fEB55476D3fC26724Ba23794FB9c723c71b9b0",
      bridgeAddress: "0xf3894e0289300a43dD7f0E0e852058011377CD26",
    },
  },
  [BinanceSmartChain.chain]: {
    ["aUSDT"]: {
      tokenAddress: "0xD93521D9E6B21D54D5276203848f1397624De87A",
      bridgeAddress: "0xcB0aB22B59a6A4d30E9cB06AF234Cad3B2Ad9658",
    },
  },
};


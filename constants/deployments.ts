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
  [Ethereum.chain]: "0xfa141247477D8f03100155e084767Aaf48e4Cfab",
  [BinanceSmartChain.chain]: "0x6cAE43dEAc56291fFb04EC293D49b9cd053919B8",
};

export const BridgeAssets: {
  [chain in Chains]: { [asset: string]: BridgeAsset };
} = {
  [Ethereum.chain]: {
    ["aUSDT"]: {
      tokenAddress: "0x11B364AF13f157a790CD5dB2E768e533b4972d63",
      bridgeAddress: "0x53de366dA21a6F3cF477C2Fbb238a9a4bbBF0002",
    },
  },
  [BinanceSmartChain.chain]: {
    ["aUSDT"]: {
      tokenAddress: "0x8b4F896F83a52dE9ee19f41eaFa7abe35007Ce47",
      bridgeAddress: "0x1A4006a7636F2715F8Fc51991708ff201cbd8c4b",
    },
  },
};


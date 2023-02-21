import { EVMNetworkConfig, resolveEVMNetworkConfig } from "@renproject/chains-ethereum";
import { EthereumBaseChain } from "@renproject/chains-ethereum/base";
import { RenNetwork } from "@renproject/utils";

const renchainTestnet: EVMNetworkConfig = {
  selector: "Catalog",

  nativeAsset: { name: "Görli Ether", symbol: "CAT", decimals: 18 }, //TODO: determine native asset
  averageConfirmationTime: 15,

  config: {
    chainId: "0x47EE",
    chainName: "Catalog Testnet",
    nativeCurrency: { name: "Görli Ether", symbol: "GOR", decimals: 18 },
    rpcUrls: ["https://rpc.catalog.fi/testnet"],
    blockExplorerUrls: ["https://goerli.infura.io"],
  },

  addresses: {
    GatewayRegistry: "0x44c2CdaE368F90544A01522C413376fC72ebd4F2",
    BasicBridge: "0x5D952fA25eD90b1151473d57F2B6C6DB568b865d",
  },
};

const renchainMainnet: EVMNetworkConfig = {
  selector: "Catalog",

  nativeAsset: { name: "Görli Ether", symbol: "CAT", decimals: 18 }, //TODO: determine native asset
  averageConfirmationTime: 15,

  config: {
    chainId: "0xc30",
    chainName: "Catalog Mainnet",
    nativeCurrency: { name: "Görli Ether", symbol: "GOR", decimals: 18 },
    rpcUrls: ["https://mainnet.catalog.fi/rpc"],
    blockExplorerUrls: ["https://goerli.infura.io"],
  },

  addresses: {
    GatewayRegistry: "0x44c2CdaE368F90544A01522C413376fC72ebd4F2",
    BasicBridge: "0x5D952fA25eD90b1151473d57F2B6C6DB568b865d",
  },
};

const renchainChaosnet: EVMNetworkConfig = {
  ...renchainTestnet,
  config: {
    ...renchainTestnet.config,
    rpcUrls: ["https://renchain-chaosnet.catalog.fi/chaosnet/paritycall"],
  },
  addresses: {
    GatewayRegistry: "0x580B601141BB9D80BFdC5a7563D937d8a1F26A92",
    BasicBridge: "0xcb6bD6B6c7D7415C0157e393Bb2B6Def7555d518",
  },
};

export class RenChain extends EthereumBaseChain {
  public static chain = "Catalog";

  public static configMap: {
    [network in RenNetwork]?: EVMNetworkConfig;
  } = {
    [RenNetwork.Mainnet]: renchainMainnet,
    [RenNetwork.Testnet]: renchainTestnet,
  };
  public configMap = RenChain.configMap;

  public static assets = {
    CAT: "CAT",
  };
  // public assets = RenChain.assets;

  public constructor({ network, ...params }: ConstructorParameters<typeof EthereumBaseChain>[0]) {
    super({
      ...params,
      network: resolveEVMNetworkConfig(RenChain.configMap, network),
    });
  }
}

import { EVMNetworkConfig } from "./utils/types";
import { EthereumBaseChain } from './base';

export const resolveEVMNetworkConfig = (
  configMap: EVMNetworkConfig,
): EVMNetworkConfig => {
  
  let networkConfig: EVMNetworkConfig | undefined = configMap;
  return networkConfig;
};


const goerliConfig: EVMNetworkConfig = {
    selector: "Goerli",
    isTestnet: true,

    nativeAsset: { name: "Görli Ether", symbol: "gETH", decimals: 18 },
    averageConfirmationTime: 15,

    config: {
        chainId: "0x5",
        chainName: "Görli",
        nativeCurrency: {
            name: "Görli Ether",
            symbol: "GOR",
            decimals: 18,
        },
        rpcUrls: [
            "https://web3-trial.cloudflare-eth.com/v1/goerli",
            "https://goerli.infura.io/v3/${INFURA_API_KEY}",
            "https://eth-goerli.alchemyapi.io/v2/${ALCHEMY_API_KEY}",
            "wss://goerli.infura.io/v3/${INFURA_API_KEY}",
            "wss://eth-goerli.alchemyapi.io/v2/${ALCHEMY_API_KEY}",
        ],
        blockExplorerUrls: ["https://goerli.etherscan.io"],
    },

    addresses: {
        GatewayRegistry: "0x5076a1F237531fa4dC8ad99bb68024aB6e1Ff701",
        BasicBridge: "0xcb6bD6B6c7D7415C0157e393Bb2B6Def7555d518",
    },
};

export const defaultConfigMap: EVMNetworkConfig = goerliConfig;

export enum EthereumTestnet {
    Goerli = "goerli",
    Görli = "goerli",
}

/**
 * The Ethereum RenJS implementation.
 */
export class Ethereum extends EthereumBaseChain {
  // Static members.
  public static chain = "Ethereum" as const;
  public static configMap = defaultConfigMap;
  public static assets = {
    ETH: "ETH" as const,
    DAI: "DAI" as const,
    REN: "REN" as const,
    USDC: "USDC" as const,
    USDT: "USDT" as const,
    EURT: "EURT" as const,
    BUSD: "BUSD" as const,
    MIM: "MIM" as const,
    CRV: "CRV" as const,
    LINK: "LINK" as const,
    UNI: "UNI" as const,
    SUSHI: "SUSHI" as const,
    FTT: "FTT" as const,
    ROOK: "ROOK" as const,
    BADGER: "BADGER" as const,
    KNC: "KNC" as const,
  };

  public configMap = Ethereum.configMap;
  public assets: typeof Ethereum.assets;

  public constructor({
    defaultTestnet,
    ...params
  }: ConstructorParameters<typeof EthereumBaseChain>[0] & {
    defaultTestnet: EthereumTestnet | `${EthereumTestnet}`;
  }) {
    const configMap = defaultConfigMap;
    super({
      ...params,
      network: resolveEVMNetworkConfig(configMap),
    });
    this.configMap = configMap;
    this.assets = Ethereum.assets;
  }
}
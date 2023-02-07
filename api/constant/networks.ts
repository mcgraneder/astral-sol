import { Polygon, BinanceSmartChain, Ethereum, Optimism, Moonbeam, Fantom, Avalanche, Kava, Arbitrum } from '@renproject/chains-ethereum';

type ProviderConfig = {
    gas: number;
    chainId: number;
    url: string;
    accounts: string[]
}
export const PorividerConfig: { [chain: string]: ProviderConfig } = {
    [Polygon.chain]: {
      gas: 3000000,
      chainId: 80001,
      url: "https://polygon-mumbai.g.alchemy.com/v2/Jcsa7sP9t3l4NPGg2pg9FDUMvVXt4Im-",
      accounts: [process.env.PK1!],
    },
    [BinanceSmartChain.chain]: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
      gas: 3000000,
      chainId: 97,
      accounts: [process.env.PK1!],
    },
    [Ethereum.chain]: {
      chainId: 5,
      url: `https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161`,
      gas: 3000000,
      accounts: [process.env.PK1!],
    },
    [Optimism.chain]: {
      chainId: 420,
      url: `https://goerli.optimism.io`,
      gas: 3000000,
      accounts: [process.env.PK1!],
    },
      [Moonbeam.chain]: {
      chainId: 1287,
      url: `https://rpc.api.moonbase.moonbeam.network`,
      gas: 3000000,
      accounts: [process.env.PK1!],
    },
     [Fantom.chain]: {
      chainId: 4002,
      url: `https://fantom-testnet.public.blastapi.io`,
      gas: 3000000,
      accounts: [process.env.PK1!],
    },
     [Avalanche.chain]: {
      chainId: 43113,
      url: `https://api.avax-test.network/ext/bc/C/rpc`,
      gas: 3000000,
      accounts: [process.env.PK1!],
    },
    [Kava.chain]: {
      chainId: 2221,
      url: `https://evm.testnet.kava.io`,
      gas: 3000000,
      accounts: [process.env.PK1!],
    },
     [Arbitrum.chain]: {
      chainId: 421613,
      url: `https://goerli-rollup.arbitrum.io/rpc`,
      gas: 3000000,
      accounts: [process.env.PK1!],
    },
}
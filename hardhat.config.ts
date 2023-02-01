/**
 * @type import('hardhat/config').HardhatUserConfig
 */
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ethers";
import "@typechain/hardhat";
import "hardhat-deploy";
import "hardhat-gas-reporter";
import "@openzeppelin/hardhat-upgrades";
import "solidity-coverage";

import { HardhatUserConfig, task } from "hardhat/config";

require("dotenv").config();

const config: HardhatUserConfig = {
  namedAccounts: {
    deployer: 0,
  },
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    localTest: {
      chainId: 31337,
      gas: 3000000,
      url: "http://127.0.0.1:8545/",
      accounts: [process.env.PK2!, process.env.PK6!],
    },
    local: {
      chainId: 31337,
      gas: 3000000,
      url: "http://0.0.0.0:8545",
    },
    catalogLocal: {
      chainId: 17,
      url: `http://0.0.0.0:8547`,
      gas: 3000000,
      accounts: [process.env.PK1!],
    },
    catalogMainnet: {
      chainId: 3120,
      url: `http://146.190.200.111/mainnet`,
      gas: 3000000,
      accounts: [
        process.env.NEW_PK1!,
        process.env.PK3!,
        process.env.PK4!,
        process.env.PK6!,
        process.env.NEW_PK1!,
        process.env.NEW_PK2!,
        process.env.NEW_PK3!,
      ],
    },
    catalogTestnet: {
      chainId: 18414,
      url: `https://rpc.catalog.fi/testnet`,
      gas: 3000000,
      accounts: [
        process.env.PK2!,
        process.env.PK3!,
        process.env.PK4!,
        process.env.PK6!,
        process.env.NEW_PK1!,
        process.env.NEW_PK2!,
        process.env.NEW_PK3!,
      ],
    },
    catalogChaosnet: {
      chainId: 5,
      url: `https://renchain-chaosnet.catalog.fi/chaosnet/paritycall`,
      gas: 3000000,
      accounts: [process.env.PK2!],
    },
    polygonTestnet: {
      gas: 3000000,
      chainId: 80001,
      url: "https://polygon-mumbai.g.alchemy.com/v2/Jcsa7sP9t3l4NPGg2pg9FDUMvVXt4Im-",
      accounts: [process.env.PK2!],
    },
    kovan: {
      chainId: 42,
      url: `https://kovan.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161`,
      gas: 3000000,
      accounts: [process.env.PK5!],
    },
    bscTestnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
      gas: 3000000,
      chainId: 97,
      accounts: [process.env.PK2!],
    },
    goerliTestnet: {
      chainId: 5,
      url: `https://goerli.infura.io/v3/ac9d2c8a561a47739b23c52e6e7ec93f
      `,
      gas: 3000000,
      accounts: [process.env.PK2!],
    },
    ethereumTestnet: {
      chainId: 5,
      url: `https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161`,
      gas: 3000000,
      accounts: ["95e35e053ae22de4390703d484c5a1a4e23d591b164b40d48bdcf87e4d300444"],
    },
    optimisticKovan: {
      chainId: 69,
      url: `https://opt-kovan.g.alchemy.com/v2/ikXkm5aNgVvP-_sgNrfOwcfKZXAujLlz`,
      gas: 3000000,
    },
    optimisticEthereum: {
      chainId: 10,
      url: `https://opt-mainnet.g.alchemy.com/v2/lVyoSuMFYXHQEpiNIbhPrOegODBvPV6d`,
      gas: 3000000,
    },
  },
  // deterministicDeployment: (network: string) => {
  //   // Skip on hardhat's local network.
  //   if (network === "31337") {
  //       return undefined;
  //   }
  //   return {
  //       factory: "0x2222229fb3318a6375fa78fd299a9a42ac6a8fbf",
  //       deployer: "0x90899d3cc800c0a9196aec83da43e46582cb7435",
  //       // Must be deployed manually. Required funding may be more on
  //       // certain chains (e.g. Ethereum mainnet).
  //       funding: "10000000000000000",
  //       signedTx: "0x00",
  //   };
  // },
  paths: {
    sources: "contracts",
  },
  mocha: {
    timeout: 40000,
  },
};

export default config;

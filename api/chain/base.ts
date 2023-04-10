import {
  JsonRpcProvider,
  Provider,
  Web3Provider,
} from "@ethersproject/providers";
import {
  ChainTransaction,
  utils,
} from "@renproject/utils";
import BigNumber from "bignumber.js";
import { ethers } from "ethers";
import { AbiItem } from "./utils/AbiType";
import {
  EthProvider,
  EthSigner,
  EVMExplorer,
  EVMNetworkConfig,
  EVMNetworkInput,
  StandardEVMExplorer,
} from "./utils/types";

export const txHashToBytes = (txHash: string): Uint8Array => {
  return utils.fromHex(txHash);
};

export const txHashFromBytes = (bytes: Uint8Array): string => {
  return utils.Ox(bytes);
};

export const checkProviderNetwork = async (
  provider: Provider,
  network: EVMNetworkConfig
): Promise<{
  result: boolean;
  actualNetworkId: number;

  expectedNetworkId: number;
  expectedNetworkLabel: string;
}> => {
  const expectedNetworkId = new BigNumber(network.config.chainId).toNumber();

  const actualNetworkId = provider
    ? (await provider.getNetwork()).chainId
    : expectedNetworkId;

  return {
    result: actualNetworkId === expectedNetworkId,
    actualNetworkId,
    expectedNetworkId,
    expectedNetworkLabel: network.config.chainName,
  };
};

export const resolveEVMNetworkConfig = (
  configMap: EVMNetworkConfig
): EVMNetworkConfig => {
  let networkConfig: EVMNetworkConfig | undefined = configMap;
  return networkConfig;
};


export const resolveRpcEndpoints = (
  urls: string[],
  variables?: {
    INFURA_API_KEY?: string;
    ALCHEMY_API_KEY?: string;
  } & { [variableKey: string]: string | undefined },
  protocol: RegExp | string = "https"
): string[] =>
  [
    ...urls.filter((url) => url.includes("${")),
    ...urls.filter((url) => !url.includes("${")),
  ]
    // Replace variable keys surround by "${...}" with variable values.
    // If a variable's value is undefined, it is not replaced.
    .map((url) =>
      Object.keys(variables || {}).reduce(
        (urlAcc, variableKey) =>
          urlAcc.replace(
            `\${${variableKey}}`,
            (variables || {})[variableKey]
              ? String((variables || {})[variableKey])
              : `\${${variableKey}}`
          ),
        url
      )
    )
    // Match only endpoints that don't include any left-over "${"s,
    // and that have the right protocol.
    .filter(
      (url) =>
        url.match(/^[^(${)]*$/) &&
        url.match(typeof protocol === "string" ? "^" + protocol : protocol)
    );


export class EthereumBaseChain {
  public static chain: string;
  public chain: string;

  public assets: { [asset: string]: string } = {};

  public static configMap: EVMNetworkConfig | {} = {};
  public configMap: EVMNetworkConfig | {} = {};

  public provider: Provider;
  public signer?: EthSigner;
  public network: EVMNetworkConfig;
  public explorer: EVMExplorer;

  public constructor({
    provider,
    signer,
  }: {
    network: EVMNetworkInput;
    provider?: EthProvider;
    signer?: EthSigner;
  }) {
    this.network = resolveEVMNetworkConfig(this.configMap as EVMNetworkConfig);
    this.chain = this.network.selector;
    this.explorer = StandardEVMExplorer(
      this.network.config.blockExplorerUrls &&
        this.network.config.blockExplorerUrls.length
        ? this.network.config.blockExplorerUrls[0]
        : ""
    );
    // Ignore not configured error.
    this.provider = undefined as never;
    this.withProvider(
      provider || resolveRpcEndpoints(this.network.config.rpcUrls)[0]
    );
    if (signer) {
      this.withSigner(signer);
    }
  }

  public addressToBytes = (address: string): Uint8Array => {
    return utils.fromHex(address);
  };

  public addressFromBytes = (bytes: Uint8Array): string => {
    return ethers.utils.getAddress(utils.Ox(bytes));
  };

  public txHashToBytes = (txHash: string): Uint8Array => {
    return txHashToBytes(txHash);
  };

  public txHashFromBytes = (bytes: Uint8Array): string => {
    return txHashFromBytes(bytes);
  };

  public transactionExplorerLink = ({
    txid,
    txHash,
  }: Partial<ChainTransaction> & ({ txid: string } | { txHash: string })):
    | string
    | undefined => {
    if (txHash) {
      return this.explorer.transaction(txHash);
    } else if (txid) {
      return this.explorer.transaction(
        this.txHashFromBytes(utils.fromBase64(txid))
      );
    }
    return undefined;
  };

  public withProvider = (web3Provider: EthProvider): this => {
    this.provider = Provider.isProvider(web3Provider)
      ? web3Provider
      : typeof web3Provider === "string"
      ? new ethers.providers.JsonRpcProvider(web3Provider)
      : // TODO: Set chainId instead of "any"?
        new ethers.providers.Web3Provider(web3Provider, "any");
    if (!this.signer) {
      try {
        this.signer = (this.provider as Web3Provider).getSigner();
      } catch (error: unknown) {
        // Ignore error.
      }
    } else {
      try {
        this.signer.connect(this.provider);
      } catch (error: unknown) {
        // Ignore - doesnt' work on all signers.
        // e.g. JsonRpc signer throws:
        // `cannot alter JSON-RPC Signer connection`.
      }
    }
    return this;
  };

  public withSigner = (signer: EthSigner): this => {
    this.signer = signer;
    try {
      this.signer.connect(this.provider);
    } catch (error: unknown) {
      // Ignore - doesnt' work on all signers.
      // e.g. JsonRpc signer throws:
      // `cannot alter JSON-RPC Signer connection`.
    }
    return this;
  };

  public checkProviderNetwork = async (
    provider?: Provider
  ): Promise<{
    result: boolean;
    actualNetworkId: number;

    expectedNetworkId: number;
    expectedNetworkLabel: string;
  }> => {
    return checkProviderNetwork(provider || this.provider, this.network);
  };
  public checkProviderNetworkCached = utils.memoize(this.checkProviderNetwork, {
    expiry: 10 * utils.sleep.SECONDS,
  });

  public checkSignerNetwork = async (): Promise<{
    result: boolean;
    actualNetworkId: number;

    expectedNetworkId: number;
    expectedNetworkLabel: string;
  }> => {
    if (!this.signer) {
      throw new Error(`Must connect ${this.chain} signer.`);
    }
    return this.checkProviderNetwork(
      // If the signer as no provider, fall back to the provider field.
      this.signer.provider || this.provider
    );
  };

  public switchSignerNetwork = async (): Promise<void> => {
    if (!this.signer) {
      throw new Error(`Must connect ${this.chain} signer.`);
    }
    if (
      !this.signer.provider ||
      !(this.signer.provider as JsonRpcProvider).send
    ) {
      throw new Error(`Signer doesn't support switching network.`);
    }

    // Check if the network is an Ethereum network, to avoid MetaMask
    // throwing `Must not specify default MetaMask chain`.
    // TODO: Try addEthereumChain first and fallback to switchEthereumChain
    // based on the returned error message.
    if (
      // Ethereum chains
      this.network.nativeAsset.symbol === "ETH" ||
      // Goerli
      this.network.nativeAsset.symbol === "gETH"
    ) {
      await (this.signer.provider as JsonRpcProvider).send(
        "wallet_switchEthereumChain",
        [
          {
            chainId: this.network.config.chainId,
          },
        ]
      );
    } else {
      await (this.signer.provider as JsonRpcProvider).send(
        "wallet_addEthereumChain",
        [this.network.config]
      );
    }
  };

  /**
   * `assetDecimals` should return the number of decimals of the asset.
   *
   * If the asset is not supported, an error should be thrown.
   *
   */
  public assetDecimals = utils.memoize(
    async (asset: string): Promise<number> => {
      // TODO: get lock asset decimals

      if (asset === this.network.nativeAsset.symbol) {
        return this.network.nativeAsset.decimals;
      }

      let tokenAddress = ""// throw
      if (!tokenAddress) {
        throw new Error(`Asset '${asset}' not supported on ${this.chain}.`);
      }

      const decimalsABI: AbiItem = {
        constant: true,
        inputs: [],
        name: "decimals",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        payable: false,
        stateMutability: "view",
        type: "function",
      };

      const tokenContract = new ethers.Contract(
        tokenAddress,
        [decimalsABI],
        this.provider
      );

      const decimalsRaw = await tokenContract.decimals();
      return new BigNumber(decimalsRaw.toString()).toNumber();
    },
    { expiry: false }
  );

  public getBalance = async (
    asset: string,
    address?: string
  ): Promise<BigNumber> => {
    if (!address) {
      if (!this.signer) {
        throw new Error(
          `Must connect ${this.chain} signer or provide address.`
        );
      }
      address = address || (await this.signer.getAddress());
    }

    if (asset === this.network.nativeAsset.symbol) {
      return new BigNumber(
        (await this.provider.getBalance(address)).toString()
      );
    }

    const balanceOfABI: AbiItem = {
      constant: true,
      inputs: [
        {
          internalType: "address",
          name: "account",
          type: "address",
        },
      ],
      name: "balanceOf",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      payable: false,
      stateMutability: "view",
      type: "function",
    };

     let tokenAddress = ""; // throw
     if (!tokenAddress) {
       throw new Error(`Asset '${asset}' not supported on ${this.chain}.`);
     }

    const tokenContract = new ethers.Contract(
      tokenAddress,
      [balanceOfABI],
      this.provider
    );

    const balanceRaw = await await tokenContract.balanceOf(address);

    return new BigNumber(balanceRaw.toString());
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   private getPayloadHandler = (payloadType: string): PayloadHandler<any> => {
//     switch (payloadType) {
//       case "approval":
//         return approvalPayloadHandler;
//       case "contract":
//         return contractPayloadHandler;
//       case "address":
//         return accountPayloadHandler;
//       case "transaction":
//         return txPayloadHandler;
//     }

//     // TODO: Allow adding custom payload handlers.

//     throw new Error(`Unknown payload type ${payloadType}`);
//   };



}

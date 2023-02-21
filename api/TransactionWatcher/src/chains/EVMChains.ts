import { Catalog, Ethereum, EVMNetworkConfig } from "@renproject/chains";
import { EthArgs } from "@renproject/chains-ethereum//utils/abi";
import { resolveRpcEndpoints } from "@renproject/chains-ethereum//utils/generic";
import { EVMPayloadInterface } from "@renproject/chains-ethereum//utils/payloads/evmParams";
// import { EthereumInjectedConnector } from "@renproject/multiwallet-ethereum-injected-connector";
// import { EthereumWalletConnectConnector } from "@renproject/multiwallet-ethereum-walletconnect-connector";
import { Chain, RenNetwork, utils } from "@renproject/utils";
import { ethers } from "ethers";

import { ALCHEMY_KEY, INFURA_KEY } from "../utils/emviornmentVariables";
import abis from "../ABIs/mintABI.json";
import { ChainDetails, ChainType } from "../types/renTypes";

type EthereumClass = Catalog | Ethereum;

export const CatalogDetails: ChainDetails<Catalog> = {
  chain: Catalog.chain,
  chainPattern: /^(catalog|cat|renchain)$/i,
  assets: Catalog.assets,
  type: ChainType.EVMChain,
  usePublicProvider: (network: RenNetwork) =>
    getPublicEthereumProvider<Catalog>(Catalog, network),

  getOutputParams: async (
    mintChain: Chain,
    to: string,
    payload: string,
    asset: string
  ): Promise<EVMPayloadInterface> =>
    getEthereumMintParams(mintChain as Catalog, to, payload, asset),
};

const getPublicEthereumProvider = <T extends EthereumClass>(
  Class: {
    chain: string;
    new (...p: any[]): T;
    configMap: { [network: string]: EVMNetworkConfig };
  },
  network: RenNetwork
): T => {
  const config = Class.configMap[network as any];
  if (!config) {
    throw new Error(
      `No network configuration for ${network} and ${Class.chain}.`
    );
  }
  const urls = resolveRpcEndpoints(config.config.rpcUrls, {
    INFURA_API_KEY: INFURA_KEY,
    ALCHEMY_API_KEY: ALCHEMY_KEY,
  });

  const provider = new ethers.providers.JsonRpcProvider(
    urls[0],
    parseInt(config.config.chainId, 16)
  );
  return new Class({ provider, network }) as any as T;
};

const getEthereumMintParams = async (
  mintChain: EthereumClass,
  to: string,
  payload: string,
  asset: string
): Promise<EVMPayloadInterface> => {
  const payloadConfig: EVMPayloadInterface["payloadConfig"] = {
    preserveAddressFormat: true,
  };

  const code = await mintChain.provider.getCode(to);
  if (code === "0x") {
    return (mintChain as EthereumClass).Account({
      account: to,
      payloadConfig,
    });
  }

  let abi = abis[0];

  let valuesToDecode = abi.inputs;
  if (
    abis.length > 1 &&
    abis.filter((abi: any) => abi.name === "mintThenSwap").length
  ) {
    abi = abis.filter((abi: any) => abi.name === "mintThenSwap")[0];
    valuesToDecode = abi.inputs?.filter(
      (x: any) => x.name !== "_newMinExchangeRate"
    );
  }

  let parameters: EthArgs;

  const abiValues = ethers.utils.defaultAbiCoder.decode(
    (valuesToDecode?.slice(0, -3) || []).map((x: any) => x.type),
    utils.fromHex(payload)
  );

  parameters = (valuesToDecode?.slice(0, -3) || []).map(
    (abiItem: any, i: number) => ({
      name: abiItem.name,
      type: abiItem.type,
      value: abiValues[i],
    })
  );

  if (abi.name === "mintThenSwap") {
    parameters = [
      ...parameters.slice(0, 1),
      {
        ...parameters[0],
        notInPayload: true,
        name: "_newMinExchangeRate",
      },
      ...parameters.slice(1),
      {
        name: "_msgSender",
        type: "address",
        value: parameters[2].value,
        onlyInPayload: true,
      },
    ];
  }

  return (mintChain as EthereumClass).Contract({
    to,
    method: abi.name || "",
    params: parameters,
    withRenParams: true,
    payloadConfig,
  });
};

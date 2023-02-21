// import { WalletPickerConfig } from "@renproject/multiwallet-ui";
import { Chain, ContractChain, RenNetwork } from "@renproject/utils";
import { CatalogDetails } from "./EVMChains";
import { BitcoinDetails } from "./BTC";
import { Catalog, Bitcoin } from "@renproject/chains";
import RenJS from "@renproject/ren";
import { EVMPayloadInterface } from "@renproject/chains-ethereum//utils/payloads/evmParams";
import { NETWORK } from '../utils/emviornmentVariables';
const RenVMChain = "RenVM";

export enum TransactionType {
  Mint = "mint",
  Burn = "burn",
  ClaimFees = "claimFees",
}

export const allChains = [CatalogDetails, BitcoinDetails];

export const getContractChainParams = async (
  mintChain: ContractChain,
  to: string,
  payload: string,
  asset: string
): Promise<ContractChain> => {
  for (const chainDetails of allChains) {
    if (chainDetails.chainPattern.exec(mintChain.chain)) {
      if (chainDetails && chainDetails.getOutputParams) {
        return chainDetails.getOutputParams(mintChain, to, payload, asset);
      } else {
        throw new Error(
          `Reconstructing mint parameters for ${mintChain.chain} is not supported yet.`
        );
      }
    }
  }

  throw new Error(`Unable to get parameters for ${mintChain.chain}`);
};

export const getCatalogInitalGateway = (): EVMPayloadInterface<string, any> => {
  const { ethereum: toChain } = setUpChains();
  const catalogDummbyInstance = toChain.Contract({
    to: "0xa3DEB3F1A03A505502C1b7D679521f93F1105542",
    method: "mint",
    params: [
      {
        name: "_token",
        type: "address",
        value: "0x13480Ea818fE2F27b82DfE7DCAc3Fd3E63A94113",
      },
      {
        name: "_to",
        type: "address",
        value: "0x13480Ea818fE2F27b82DfE7DCAc3Fd3E63A94113",
      },
    ],
    withRenParams: true,
  });
  return catalogDummbyInstance;
};

//expand to all chains after MVP
export const setUpChains = () => {
  const network = NETWORK;
  const ethereum = new Catalog({
    network,
    provider: Catalog.configMap[network]!.config.rpcUrls[0],
  });
  const bitcoin = new Bitcoin({ network });
  const renJS = new RenJS(network).withChains(ethereum, bitcoin);
  return { network, ethereum, bitcoin, renJS };
};

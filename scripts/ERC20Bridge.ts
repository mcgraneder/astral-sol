import { BinanceSmartChain, Ethereum, Polygon } from '@renproject/chains-ethereum';
import RenJS from "@renproject/ren";

import { RenNetwork } from "@renproject/utils";
import { getEVMChain } from "../api/utils/getProvider";
import { Bitcoin } from '@renproject/chains-bitcoin';
const ADMIN_KEY = process.env.PK1!

const bridge = async () => {
  const binanceSmartChain = new BinanceSmartChain({ network: RenNetwork.Testnet});
  // const ethereum = getEVMChain(Ethereum, RenNetwork.Testnet);
  const asset = "BTC";
   const bitcoin = new Bitcoin({ network: RenNetwork.Testnet });

  const ren = new RenJS("testnet").withChains(binanceSmartChain, bitcoin);
 
  const gateway = await ren.gateway({
    asset,
    from: bitcoin.GatewayAddress(),
    to: binanceSmartChain.Account({
      account: "0x081B3edA60f50631E5e966ED75bf6598cF69ee3C",
    }),
  });

  console.log(gateway.gatewayAddress)
  // await gateway.inSetup.approval?.submit!();
  // // All transactions now follow a submit/wait pattern - see TxSubmitter
  // // interface.
  // await gateway.inSetup.approval?.wait();

  // await gateway.in!.submit!().on("progress", console.log);
  // // Wait for the first confirmation.
  // await gateway.in!.wait(1);

  // // NOTE: Event has been renamed from "deposit" to "transaction".
  // gateway.on("transaction", (tx) => {
  //   (async () => {
  //     // GatewayTransaction parameters are serializable. To re-create
  //     // the transaction, call `renJS.gatewayTransaction`.
  //     console.log(tx.params);

  //     // Wait for remaining confirmations for input transaction.
  //     await tx.in.wait();

  //     // RenVM transaction also follows the submit/wait pattern.
  //     await tx.renVM.submit().on("progress", console.log);
  //     await tx.renVM.wait();

  //     // `submit` accepts a `txConfig` parameter for overriding
  //     // transaction config.
  //     await tx.out!.submit!({
  //       txConfig: {
  //         gasLimit: 1000000,
  //       },
  //     });
  //     await tx.out.wait();

  //     // All transactions return a `ChainTransaction` object in the
  //     // progress, with a `txid` field (base64) and a `txidFormatted`
  //     // field (chain-dependent).
  //     const outTx = tx.out.progress.transaction;
  //     console.log("Done:", outTx?.explorerLink);

      // All chain classes expose a common set of helper functions (see
      // `Chain` class.)
      // console.log(tx.toChain.transactionExplorerLink(outTx));
    // })().catch(console.error);
  // });
};

bridge();
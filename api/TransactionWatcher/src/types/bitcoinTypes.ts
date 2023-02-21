export type ScriptSig = {
  asm: string;
  hex: string;
};

export type TransactionInput = {
  txid: string;
  vout: number;
  scriptSig: ScriptSig;
  sequence: number;
};

export type ScriptPubKey = {
  asm: string;
  desc: string;
  hex: string;
  address: string;
  type: string;
};

export type TransactionOutput = {
  value: number;
  n: number;
  scriptPubKey: ScriptPubKey;
};

export type BitcoinTransaction = {
  txid: string;
  hash: string;
  version: number;
  size: number;
  vsize: number;
  weight: number;
  locktime: number;
  vin: TransactionInput[];
  vout: TransactionOutput[];
  fee: number;
  hex: string;
};

export type BitcoinBlockInfo = {
  hash: string;
  confirmations: number;
  height: number;
  version: number;
  versionHex: string;
  merkleroot: string;
  time: number;
  mediantime: number;
  nonce: number;
  bits: string;
  difficulty: number;
  chainwork: string;
  nTx: number;
  previousblockhash: string;
  strippedsize: number;
  size: number;
  weight: number;
  tx: BitcoinTransaction[];
};



export type BitcoinResponse = {
  result: any;
  error: Error | null;
  id: string | null;
};


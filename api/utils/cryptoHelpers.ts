import * as crypto from "crypto";
import BN from "bn.js";
import { keccak256, toChecksumAddress } from "web3-utils";

export const strip0x = (hex: string) =>
  hex.substring(0, 2) === "0x" ? hex.slice(2) : hex;

export const hexToBuffer = (hex: string | BN | Buffer) =>
  BN.isBN(hex)
    ? hex.toBuffer()
    : Buffer.isBuffer(hex)
    ? hex
    : Buffer.from(strip0x(hex), "hex");

export const randomBytes = (bytes: number): string => {
  return Ox(crypto.randomBytes(bytes));
};

export const randomAddress = (): string => {
  return toChecksumAddress(randomBytes(20));
};

export const Ox = (hex: string | BN | Buffer) => {
  const hexString = typeof hex === "string" ? hex : hex.toString("hex");
  return hexString.substring(0, 2) === "0x" ? hexString : `0x${hexString}`;
};

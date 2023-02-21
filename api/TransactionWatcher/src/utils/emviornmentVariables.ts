import { RenNetwork } from "@renproject/utils";
import dotenv from "dotenv";

dotenv.config();

export const MONGO_USERNAME = process.env.MONGO_USERNAME || "";
export const MONGO_PASSWORD = process.env.MONGO_PASSWORD || "";
export const MONGO_URL = `mongodb+srv://${MONGO_USERNAME}:${MONGO_PASSWORD}@cluster0.2lk2hmp.mongodb.net/`;

const SERVER_PORT = process.env.SERVER_PORT
  ? Number(process.env.SERVER_PORT)
  : 1337;

export const config = {
  mongo: {
    url: MONGO_URL,
  },
  server: {
    port: SERVER_PORT,
  },
};

export const NETWORK: RenNetwork =
  (process.env.APP_NETWORK === "development" ? RenNetwork.Testnet : RenNetwork.Mainnet);

export const QUICKNODE_ADDRESS_LOOKUP_URL =
  process.env.APP_NETWORK === "development"
    ? process.env.BITCOIN_TESTNET_NODE
    : process.env.BITCOIN_MAINNET_NODE;
    
export const INFURA_KEY = process.env.INFURA_KEY;
export const ALCHEMY_KEY = process.env.ALCHEMY_KEY;

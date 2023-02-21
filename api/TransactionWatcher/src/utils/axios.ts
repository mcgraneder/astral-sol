import Axios, { AxiosRequestConfig } from "axios";
import { BitcoinResponse } from "../types/bitcoinTypes";

export const axios = Axios.create({
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export const get = async (path: string, config?: AxiosRequestConfig) => {
  try {
    const { data } = await axios.get(path, config);
    return data;
  } catch (error) {
    console.error(`GET ${path}`);
    console.error(error);
    return null;
  }
};

export const post = async (
  path: string,
  data: any,
  config?: AxiosRequestConfig
): Promise<BitcoinResponse> => {
  try {
    const { data: received } = await axios.post(path, data, config);
    return received;
  } catch (error) {
    throw new Error("failed")
  }
};

export const patch = async (
  path: string,
  data: any,
  config?: AxiosRequestConfig
) => {
  try {
    const { data: received } = await axios.patch(path, data, config);
    return received;
  } catch (error) {
    console.error(`PATCH ${path}`);
    console.error(error);
    return null;
  }
};

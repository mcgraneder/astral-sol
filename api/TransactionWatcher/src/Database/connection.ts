import mongoose from "mongoose";
import { config } from "../utils/emviornmentVariables";
import express from "express";
import Logging from "../utils/logger";
import http from 'http';

const router = express();

export const connectToDB = async (): Promise<void> => {
  mongoose
    .connect(config.mongo.url, { retryWrites: true, w: "majority" })
    .then(() => {
      console.log("connected");
      StartServer();
    })
    .catch((error) => console.error(error));
};

const StartServer = () => {
  router.use(express.urlencoded({ extended: true }));
  router.use(express.json());
  http.createServer(router).listen(config.server.port, async () => {
    Logging.info(`Server is running on port ${config.server.port}`);
  });
};

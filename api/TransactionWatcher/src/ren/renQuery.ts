import { axios } from '../utils/axios';
let data = JSON.stringify({
  method: "ren_queryGateway",
  id: 1,
  jsonrpc: "2.0",
  params: {
    gateway: "2MtnBHP3yEjqAiTLa7UYyhH93rNNv6XKddY",
  },
});

let config = {
  method: "post",
  url: "https://rpc-testnet.renproject.io/ren_queryTx",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  data: data,
};

axios(config)
  .then((response) => {
    console.log(response.data);
  })
  .catch((error) => {
    console.log(error);
  });

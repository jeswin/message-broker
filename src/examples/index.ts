import { BrokerType, createMessageBroker } from "../messageBroker.js";
import { createMessageBrokerClient } from "../messageBrokerClient.js";

function getBroker() {
  return createMessageBroker().attachHandler(
    "adder",
    async (params: { a: number; b: number }) => params.a + params.b
  );
}

function getBrokerClient() {
  return createMessageBrokerClient<BrokerType<typeof getBroker>>(() => {});
}

const client = getBrokerClient();

const sum = await client.send("adder", { a: 10, b: 20 });

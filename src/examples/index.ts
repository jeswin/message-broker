import { BrokerType, createMessageBroker } from "../messageBroker.js";
import { createMessageClient } from "../messageClient.js";

function getBroker() {
  return createMessageBroker()
    .attachHandler(
      "adder",
      async (params: { a: number; b: number }) => params.a + params.b
    )
    .attachHandler("random", async () => 7);
}

function getBrokerClient() {
  return createMessageClient<BrokerType<typeof getBroker>>(() => {});
}

const client = getBrokerClient();

const nothing = client.send("adder", { a: 10, b: 20 });
const sum = await client.wait("adder", { a: 10, b: 20 });
const aRandomNumber = await client.send("random", undefined);

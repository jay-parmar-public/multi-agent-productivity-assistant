import { getManagerAgent } from "../src/agents/manager.js";
import { InMemoryRunner } from "@google/adk";

async function run() {
  const { managerAgent } = await getManagerAgent();
  const runner = new InMemoryRunner({ agent: managerAgent });

  const generator = runner.runEphemeral({
    userId: "test",
    newMessage: { role: "user", parts: [{ text: "Hello" }] }
  });

  for await (const event of generator) {
     console.log(event.type);
  }
}
run().catch(console.error);

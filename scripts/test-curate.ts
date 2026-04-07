import { getCurationAgent } from "../src/agents/curation.js";
import { InMemoryRunner } from "@google/adk";

async function run() {
  const curationAgent = getCurationAgent([]);
  const runner = new InMemoryRunner({ agent: curationAgent });

  const generator = runner.runEphemeral({
    userId: "manager",
    newMessage: { role: "user", parts: [{ text: "Curate this achievement. Team: Team Alpha. Text: Successfully completed the Project Phoenix cloud migration." }] }
  });

  for await (const event of generator) {
     console.log(JSON.stringify(event, null, 2));
  }
}
run().catch(console.error);

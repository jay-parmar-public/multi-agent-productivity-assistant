// @ts-nocheck
import { Hono } from "hono";
import { getManagerAgent } from "../agents/manager.js";
import { InMemoryRunner } from "@google/adk";

const app = new Hono();

app.post("/curate", async (c) => {
  try {
    const { managerAgent } = await getManagerAgent();
    const runner = new InMemoryRunner({ agent: managerAgent });

    const generator = runner.runEphemeral({
      userId: "api-user",
      newMessage: { role: "user", parts: [{ text: "Read achievements from the mock Google Form. Pass them to the curation agent. Do not generate a digest yet." }] },
    });

    const events = [];
    let finalDigest = null;
    for await (const event of generator) {
      events.push(event);
      // Try to extract the final structured data if it's there
      if (event.type === "activity" && event.data?.structuredData) {
        finalDigest = event.data.structuredData;
      }
    }

    return c.json({ success: true, digest: finalDigest, events });
  } catch (error) {
    console.error(error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.post("/digest/generate", async (c) => {
  try {
    const { managerAgent } = await getManagerAgent();
    const runner = new InMemoryRunner({ agent: managerAgent });

    const generator = runner.runEphemeral({
      userId: "api-user",
      newMessage: { role: "user", parts: [{ text: "Read achievements from the mock Google Form, curate them all, AND then generate the final weekly markdown digest. Output the digest json payload." }] },
    });

    const events = [];
    let finalDigest = null;
    for await (const event of generator) {
      events.push(event);
      if (event.type === "activity" && event.data?.structuredData) {
        finalDigest = event.data.structuredData;
      }
    }

    return c.json({ success: true, digest: finalDigest, events });
  } catch (error) {
    console.error(error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

export default app;

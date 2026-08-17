import { Router } from "express";
import { ok, fail } from "../lib/apiResponse";
import { publishLed } from "../mqtt";

export const ledRouter = Router();

// POST /api/led  { "n": 1 | 2, "state": "ON" | "OFF" }
// Publishes to mmcl/nhom1/led/n{n} - the Wemos D1 subscribes to these topics.
ledRouter.post("/", async (req, res) => {
  const { n, state } = req.body ?? {};

  if (n !== 1 && n !== 2) {
    return fail(res, 400, "n must be 1 or 2");
  }
  if (state !== "ON" && state !== "OFF") {
    return fail(res, 400, "state must be \"ON\" or \"OFF\"");
  }

  try {
    const topic = publishLed(n, state);
    return ok(res, `published ${state} to ${topic}`, { n, state, topic });
  } catch (err) {
    return fail(res, 503, err instanceof Error ? err.message : "MQTT publish failed");
  }
});

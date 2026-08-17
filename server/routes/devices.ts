import { Router } from "express";
import { ok } from "../lib/apiResponse";
import { Device } from "../models/Device";
import { env } from "../env";

export const devicesRouter = Router();

// GET /api/devices - powers the Dashboard's "Devices Control" list.
devicesRouter.get("/", async (_req, res) => {
  const devices = await Device.find().lean();
  const now = Date.now();

  const data = devices.map((d) => ({
    deviceId: d.deviceId,
    name: d.name,
    kind: d.kind,
    ip: d.ip ?? null,
    lastSeen: d.lastSeen,
    online: now - new Date(d.lastSeen).getTime() < env.DEVICE_OFFLINE_AFTER_MS,
  }));

  return ok(res, "devices", data);
});

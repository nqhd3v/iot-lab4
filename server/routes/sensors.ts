import { Router } from "express";
import { ok, created, fail } from "../lib/apiResponse";
import { SensorReading } from "../models/SensorReading";
import { Device } from "../models/Device";
import { broadcast } from "../ws";

export const sensorsRouter = Router();

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

// POST /api/sensors - Wemos D1 posts a reading here every ~5s.
sensorsRouter.post("/", async (req, res) => {
  const { deviceId, ip, temperature, humidity, light } = req.body ?? {};

  if (typeof deviceId !== "string" || !deviceId) {
    return fail(res, 400, "deviceId is required");
  }
  if (!isFiniteNumber(temperature) || !isFiniteNumber(humidity) || !isFiniteNumber(light)) {
    return fail(res, 400, "temperature, humidity and light must all be numbers");
  }

  const reading = await SensorReading.create({ deviceId, ip, temperature, humidity, light });

  await Device.findOneAndUpdate(
    { deviceId },
    { deviceId, name: "Wemos D1", kind: "wemos", ip, lastSeen: new Date() },
    { upsert: true }
  );

  broadcast("reading", {
    deviceId,
    temperature,
    humidity,
    light,
    createdAt: reading.createdAt,
  });

  return created(res, "reading stored", { temperature, humidity, light });
});

// GET /api/sensors/latest - most recent reading, for first paint of the Main screen.
sensorsRouter.get("/latest", async (_req, res) => {
  const reading = await SensorReading.findOne().sort({ createdAt: -1 }).lean();
  if (!reading) return ok(res, "no readings yet", null);
  return ok(res, "latest reading", {
    temperature: reading.temperature,
    humidity: reading.humidity,
    light: reading.light,
    createdAt: reading.createdAt,
  });
});

// GET /api/sensors/history?limit=50 - recent points for the 3 charts.
sensorsRouter.get("/history", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 500);
  const readings = await SensorReading.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  readings.reverse(); // chronological order for charting

  return ok(res, "history", {
    temperature: readings.map((r) => ({ t: r.createdAt, value: r.temperature })),
    humidity: readings.map((r) => ({ t: r.createdAt, value: r.humidity })),
    light: readings.map((r) => ({ t: r.createdAt, value: r.light })),
  });
});

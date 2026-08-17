import path from "path";
import dotenv from "dotenv";

// Resolve .env relative to THIS file, not process.cwd(). The npm scripts are
// run from the repo root (`npm run server:dev`), so a bare `dotenv/config`
// would look for lab4/.env and silently miss lab4/server/.env.
dotenv.config({ path: path.resolve(__dirname, ".env") });

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined) {
    throw new Error(
      `Missing required env var ${name}. Expected it in ${path.resolve(__dirname, ".env")}`
    );
  }
  return v;
}

export const env = {
  PORT: Number(process.env.PORT ?? 4000),
  MONGODB_URI: required("MONGODB_URI"),
  MQTT_URL: process.env.MQTT_URL ?? "mqtt://192.168.1.34:1884",
  MQTT_TOPIC_PREFIX: process.env.MQTT_TOPIC_PREFIX ?? "mmcl/nhom1",
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  // How long (ms) since a device's last contact before we consider it offline.
  DEVICE_OFFLINE_AFTER_MS: Number(process.env.DEVICE_OFFLINE_AFTER_MS ?? 20_000),
};

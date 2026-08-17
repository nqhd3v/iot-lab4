import express from "express";
import cors from "cors";
import http from "http";
import { env } from "./env";
import { connectDb } from "./db";
import { connectMqtt } from "./mqtt";
import { initWs } from "./ws";
import { sensorsRouter } from "./routes/sensors";
import { devicesRouter } from "./routes/devices";
import { ledRouter } from "./routes/led";

async function main() {
  await connectDb();
  connectMqtt();

  const app = express();
  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json());

  app.get("/api/health", (_req, res) => res.json({ error: false, message: "ok", data: null }));
  app.use("/api/sensors", sensorsRouter);
  app.use("/api/devices", devicesRouter);
  app.use("/api/led", ledRouter);

  const server = http.createServer(app);
  initWs(server);

  server.listen(env.PORT, () => {
    console.log(`[server] REST API + WS listening on http://0.0.0.0:${env.PORT}`);
  });
}

main().catch((err) => {
  console.error("[server] fatal startup error:", err);
  process.exit(1);
});

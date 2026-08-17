import { WebSocketServer, WebSocket } from "ws";
import type { Server as HttpServer } from "http";

let wss: WebSocketServer | null = null;

export function initWs(server: HttpServer) {
  wss = new WebSocketServer({ server, path: "/ws" });
  wss.on("connection", (socket) => {
    socket.send(JSON.stringify({ type: "hello", data: { ok: true } }));
  });
  console.log("[ws] websocket server ready at /ws");
  return wss;
}

export function broadcast(type: string, data: unknown) {
  if (!wss) return;
  const payload = JSON.stringify({ type, data });
  wss.clients.forEach((c) => {
    if (c.readyState === WebSocket.OPEN) c.send(payload);
  });
}

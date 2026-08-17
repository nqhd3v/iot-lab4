export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000";
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:4000/ws";

interface Envelope<T> {
  error: boolean;
  message: string;
  data: T;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  const body: Envelope<T> = await res.json();
  if (body.error) throw new Error(body.message);
  return body.data;
}

export interface DeviceStatus {
  deviceId: string;
  name: string;
  kind: "wemos" | "raspberrypi";
  ip: string | null;
  lastSeen: string;
  online: boolean;
}

export interface LatestReading {
  temperature: number;
  humidity: number;
  light: number;
  createdAt: string;
}

export interface HistoryPoint {
  t: string;
  value: number;
}

export interface History {
  temperature: HistoryPoint[];
  humidity: HistoryPoint[];
  light: HistoryPoint[];
}

export const api = {
  devices: () => request<DeviceStatus[]>("/api/devices"),
  latest: () => request<LatestReading | null>("/api/sensors/latest"),
  history: (limit = 50) => request<History>(`/api/sensors/history?limit=${limit}`),
  setLed: (n: 1 | 2, state: "ON" | "OFF") =>
    request<{ n: number; state: string; topic: string }>("/api/led", {
      method: "POST",
      body: JSON.stringify({ n, state }),
    }),
};

"use client";

import { useEffect, useState } from "react";
import { Circle } from "@phosphor-icons/react/ssr";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type DeviceStatus } from "@/lib/api";

function timeAgo(iso: string) {
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.round(m / 60)}h ago`;
}

export function DeviceList() {
  const [devices, setDevices] = useState<DeviceStatus[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await api.devices();
        if (!cancelled) {
          setDevices(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "failed to load devices");
      }
    }

    load();
    const interval = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (error) {
    return <p className="text-destructive text-xs">Could not reach the API: {error}</p>;
  }

  if (!devices) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No device has contacted the API yet. Flash the Wemos D1 and make sure the server is running.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {devices.map((d) => (
        <Card key={d.deviceId}>
          <CardContent className="flex items-center gap-3">
            <Circle
              size={10}
              weight="fill"
              className={d.online ? "text-[#0ca30c]" : "text-destructive"}
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium">{d.name}</span>
              <span className="text-muted-foreground text-xs">
                {d.ip ?? "unknown ip"} &middot; last seen {timeAgo(d.lastSeen)}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

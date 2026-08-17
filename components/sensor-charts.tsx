"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type History, type HistoryPoint } from "@/lib/api";

const REFRESH_MS = 10_000;

function formatTime(t: string) {
  const d = new Date(t);
  // Built from parts rather than toLocaleTimeString: the server prerender and
  // the browser can sit in different locales/timezones, and that mismatch is a
  // classic hydration error.
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function ChartTooltip({
  active,
  payload,
  unit,
}: {
  active?: boolean;
  payload?: { value: number; payload: HistoryPoint }[];
  unit: string;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0];
  return (
    <div className="bg-popover text-popover-foreground rounded-md border px-2.5 py-1.5 text-xs shadow-md">
      <div className="font-medium">
        {point.value.toFixed(1)} {unit}
      </div>
      <div className="text-muted-foreground">{formatTime(point.payload.t)}</div>
    </div>
  );
}

function SensorChart({
  title,
  description,
  data,
  color,
  unit,
}: {
  title: string;
  description: string;
  data: HistoryPoint[] | undefined;
  color: string;
  unit: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {!data ? (
          <Skeleton className="h-48 w-full" />
        ) : data.length === 0 ? (
          <p className="text-muted-foreground flex h-48 items-center justify-center text-xs">
            No data yet
          </p>
        ) : (
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="t"
                  tickFormatter={formatTime}
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  axisLine={{ stroke: "var(--border)" }}
                  tickLine={false}
                  minTickGap={40}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip content={<ChartTooltip unit={unit} />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function SensorCharts() {
  const [history, setHistory] = useState<History | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await api.history(50);
        if (!cancelled) setHistory(data);
      } catch {
        // keep the last good data on a transient failure
      }
    }

    load();
    const interval = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <SensorChart
        title="Temperature"
        description="From BME680, degrees Celsius"
        data={history?.temperature}
        color="var(--chart-5)"
        unit="°C"
      />
      <SensorChart
        title="Humidity"
        description="From BME680, relative humidity"
        data={history?.humidity}
        color="var(--chart-3)"
        unit="%"
      />
      <SensorChart
        title="Light"
        description="From BH1750, illuminance"
        data={history?.light}
        color="var(--chart-4)"
        unit="lux"
      />
    </div>
  );
}

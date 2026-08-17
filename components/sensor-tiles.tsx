"use client";

import { useEffect, useState } from "react";
import { Thermometer, Drop, Sun } from "@phosphor-icons/react/ssr";
import type { Icon } from "@phosphor-icons/react";

import { Card, CardContent } from "@/components/ui/card";
import { api, type LatestReading } from "@/lib/api";
import { useSocket } from "@/lib/useSocket";

function SensorTile({
  icon: Icon,
  label,
  value,
  unit,
}: {
  icon: Icon;
  label: string;
  value: number | null;
  unit: string;
}) {
  return (
    <Card className="flex-1">
      <CardContent className="flex flex-col items-center gap-2">
        <Icon size={22} className="text-muted-foreground" />
        <span className="text-2xl font-semibold">
          {value === null ? "--" : value.toFixed(1)}
          <span className="text-muted-foreground ml-1 text-sm font-normal">{unit}</span>
        </span>
        <span className="text-muted-foreground text-xs">{label}</span>
      </CardContent>
    </Card>
  );
}

export function SensorTiles() {
  const [reading, setReading] = useState<LatestReading | null>(null);

  useEffect(() => {
    api.latest().then(setReading).catch(() => {});
  }, []);

  // Item 4 (realtime): the server pushes each new reading over the websocket
  // as soon as the Wemos D1 posts it, so no refresh button is needed.
  useSocket("reading", (data) => setReading(data as LatestReading));

  return (
    <div className="flex gap-3">
      <SensorTile icon={Thermometer} label="Temperature" value={reading?.temperature ?? null} unit="°C" />
      <SensorTile icon={Drop} label="Humidity" value={reading?.humidity ?? null} unit="%" />
      <SensorTile icon={Sun} label="Light" value={reading?.light ?? null} unit="lux" />
    </div>
  );
}

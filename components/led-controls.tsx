"use client";

import { useState } from "react";

import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";

type LedKey = 1 | 2;

export function LedControls() {
  const [led1, setLed1] = useState(false);
  const [led2, setLed2] = useState(false);
  const [pending, setPending] = useState<LedKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggle(n: LedKey, next: boolean) {
    const setState = n === 1 ? setLed1 : setLed2;
    const previous = n === 1 ? led1 : led2;

    setPending(n);
    setError(null);
    setState(next); // optimistic

    try {
      await api.setLed(n, next ? "ON" : "OFF");
    } catch (err) {
      setState(previous); // revert if the broker publish failed
      setError(err instanceof Error ? err.message : "failed to publish to MQTT");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-destructive text-xs">{error}</p>}

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Light 1</span>
        <Switch
          checked={led1}
          onCheckedChange={(v) => toggle(1, v)}
          disabled={pending === 1}
          aria-label="Toggle Light 1"
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Light 2</span>
        <Switch
          checked={led2}
          onCheckedChange={(v) => toggle(2, v)}
          disabled={pending === 2}
          aria-label="Toggle Light 2"
        />
      </div>
    </div>
  );
}

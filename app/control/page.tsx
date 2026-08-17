import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SensorTiles } from "@/components/sensor-tiles";
import { LedControls } from "@/components/led-controls";

// Server Component shell; the live sensor tiles and the LED switches are the
// only interactive parts, so they are the only client islands.
export default function ControlPage() {
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Control Your Devices</h1>
        <p className="text-muted-foreground text-xs">
          Sensor values update live as the Wemos D1 reports them.
        </p>
      </section>

      <SensorTiles />

      <Card>
        <CardHeader>
          <CardTitle>Devices</CardTitle>
        </CardHeader>
        <CardContent>
          <LedControls />
        </CardContent>
      </Card>
    </div>
  );
}

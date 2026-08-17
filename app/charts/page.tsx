import { SensorCharts } from "@/components/sensor-charts";

// Server Component shell; recharts needs the DOM, so the charts themselves are
// a client island.
export default function ChartsPage() {
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Visualize Your Data</h1>
        <p className="text-muted-foreground text-xs">Last 50 readings, refreshed every 10s.</p>
      </section>

      <SensorCharts />
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeviceList } from "@/components/device-list";
import { TEAM } from "@/lib/constants";

// Server Component: the welcome block and team card are static, so they are
// rendered on the server. Only the live device list is a client island.
export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-1">
        <p className="text-muted-foreground text-sm">Hi there,</p>
        <h1 className="text-xl font-semibold">Welcome to IoT System {TEAM.groupName}!</h1>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Team</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-muted-foreground flex flex-col gap-1 text-sm">
            {TEAM.members.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">Devices Control</h2>
        <DeviceList />
      </section>
    </div>
  );
}

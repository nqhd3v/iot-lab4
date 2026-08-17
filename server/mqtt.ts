import mqtt, { MqttClient } from "mqtt";
import { env } from "./env";
import { Device } from "./models/Device";

let client: MqttClient | null = null;

const RASPBERRY_PI_DEVICE_ID = "raspberrypi-mqtt";

async function touchPiDevice() {
  try {
    await Device.findOneAndUpdate(
      { deviceId: RASPBERRY_PI_DEVICE_ID },
      {
        deviceId: RASPBERRY_PI_DEVICE_ID,
        name: "Raspberry Pi (MQTT Broker)",
        kind: "raspberrypi",
        ip: env.MQTT_URL.replace(/^mqtts?:\/\//, "").split(":")[0],
        lastSeen: new Date(),
      },
      { upsert: true }
    );
  } catch (err) {
    console.error("[mqtt] failed to update Pi device heartbeat:", err);
  }
}

export function connectMqtt(): MqttClient {
  client = mqtt.connect(env.MQTT_URL, {
    clientId: `lab4-server-${Math.random().toString(16).slice(2, 8)}`,
    reconnectPeriod: 2000,
  });

  client.on("connect", () => {
    console.log(`[mqtt] connected to ${env.MQTT_URL}`);
    touchPiDevice();
  });

  client.on("reconnect", () => console.log("[mqtt] reconnecting..."));
  client.on("error", (err) => console.error("[mqtt] error:", err.message));

  // Broker only stays "seen" while the connection is actually alive.
  setInterval(() => {
    if (client?.connected) touchPiDevice();
  }, 10_000);

  return client;
}

export function publishLed(n: 1 | 2, state: "ON" | "OFF") {
  if (!client || !client.connected) {
    throw new Error("MQTT client is not connected to the broker");
  }
  const topic = `${env.MQTT_TOPIC_PREFIX}/led/n${n}`;
  client.publish(topic, state);
  return topic;
}

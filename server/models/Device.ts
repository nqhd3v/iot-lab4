import { Schema, model, models, Model } from "mongoose";

export interface DeviceDoc {
  deviceId: string;
  name: string;
  kind: "wemos" | "raspberrypi";
  ip?: string;
  lastSeen: Date;
}

const DeviceSchema = new Schema<DeviceDoc>({
  deviceId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  kind: { type: String, enum: ["wemos", "raspberrypi"], required: true },
  ip: { type: String },
  lastSeen: { type: Date, required: true, default: () => new Date() },
});

export const Device: Model<DeviceDoc> =
  (models.Device as Model<DeviceDoc>) || model<DeviceDoc>("Device", DeviceSchema);

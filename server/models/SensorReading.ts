import { Schema, model, models, Model } from "mongoose";

export interface SensorReadingDoc {
  deviceId: string;
  ip?: string;
  temperature: number;
  humidity: number;
  light: number;
  createdAt: Date;
}

const SensorReadingSchema = new Schema<SensorReadingDoc>(
  {
    deviceId: { type: String, required: true, index: true },
    ip: { type: String },
    temperature: { type: Number, required: true },
    humidity: { type: Number, required: true },
    light: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Reuse the compiled model on hot reload (tsx watch) instead of redefining it.
export const SensorReading: Model<SensorReadingDoc> =
  (models.SensorReading as Model<SensorReadingDoc>) ||
  model<SensorReadingDoc>("SensorReading", SensorReadingSchema);

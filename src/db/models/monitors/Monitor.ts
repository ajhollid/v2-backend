import mongoose, { Schema, Document, Types } from "mongoose";
import { Check } from "../index.js";

export const MonitorTypes = ["http", "https"] as const;
export type MonitorType = (typeof MonitorTypes)[number];

export const MonitorStatuses = [
  "up",
  "down",
  "paused",
  "initializing",
] as const;
export type MonitorStatus = (typeof MonitorStatuses)[number];
export interface IMonitor extends Document {
  _id: Types.ObjectId;
  name: string;
  url: string;
  type: MonitorType;
  interval: number; // in ms
  isActive: boolean;
  status: MonitorStatus;
  n: number; // Number of consecutive successes required to change status
  m: number; // Length of the array
  lastStatuses: string[]; // Array to store last few statuses
  lastCheckedAt?: Date;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MonitorSchema = new Schema<IMonitor>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    url: { type: String, required: true, trim: true },
    type: {
      type: String,
      required: true,
      enum: MonitorTypes,
    },
    interval: { type: Number, required: true, default: 60000 },
    isActive: { type: Boolean, required: true, default: true },
    status: {
      type: String,
      required: true,
      default: "initializing",
      enum: MonitorStatuses,
    },
    n: { type: Number, required: true, default: 1 },
    m: { type: Number, required: true, default: 2 },
    lastStatuses: {
      type: [String],
      enum: MonitorStatuses,
      default: [],
      maxLength: 10,
    },
    lastCheckedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

MonitorSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    try {
      const monitorId = this._id;
      await Check.deleteMany({ monitorId });
      next();
    } catch (error: any) {
      next(error);
    }
  }
);

MonitorSchema.index({ isActive: 1 });
MonitorSchema.index({ status: 1 });
MonitorSchema.index({ type: 1 });
MonitorSchema.index({ lastCheckedAt: 1 });
MonitorSchema.index({ isActive: 1, status: 1 });
MonitorSchema.index({ createdBy: 1 });
MonitorSchema.index({ updatedBy: 1 });

export const Monitor = mongoose.model<IMonitor>("Monitor", MonitorSchema);

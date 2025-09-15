import mongoose from "mongoose";
import {
  IMonitor,
  Monitor,
  ITokenizedUser,
  IMonitorStats,
  MonitorStats,
  Check,
} from "../../db/models/index.js";
import ApiError from "../../utils/ApiError.js";
import { IJobQueue } from "../infrastructure/JobQueue.js";

interface groupClauseType {
  _id: { [key: string]: any };
  count: object;
  avgResponseTime: object;
}

export interface MonitorWithChecksResponse {
  monitor: IMonitor;
  checks: Array<{
    _id: string;
    count: number;
    avgResponseTime: number;
  }>;
  stats: IMonitorStats;
}

export interface IMonitorService {
  create: (
    tokenizedUser: ITokenizedUser,
    monitorData: IMonitor
  ) => Promise<IMonitor>;
  getAll: () => Promise<IMonitor[]>;
  getAllEmbedChecks: (page: number, limit: number) => Promise<any[]>;
  get: (monitorId: string) => Promise<IMonitor | null>;
  getEmbedChecks: (
    monitorId: string,
    range: string,
    status?: string
  ) => Promise<MonitorWithChecksResponse>;
  update: (
    tokenizedUser: ITokenizedUser,
    monitorId: string,
    updateData: Partial<IMonitor>
  ) => Promise<IMonitor | null>;
  delete: (monitorId: string) => Promise<void>;
}

class MonitorService implements IMonitorService {
  private jobQueue: IJobQueue;
  constructor(jobQueue: IJobQueue) {
    this.jobQueue = jobQueue;
  }

  async create(tokenizedUser: ITokenizedUser, monitorData: IMonitor) {
    const monitor = await Monitor.create({
      ...monitorData,
      createdBy: tokenizedUser.sub,
      updatedBy: tokenizedUser.sub,
    });
    await MonitorStats.create({
      monitorId: monitor._id,
    });
    await this.jobQueue.addJob(monitor);
    return monitor;
  }

  async getAll() {
    return Monitor.find();
  }

  async getAllEmbedChecks(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const monitors = await Monitor.find().skip(skip).limit(limit);
    const monitorsWithChecks = await Promise.all(
      monitors.map(async (monitor) => {
        const checks = await Check.find({ monitorId: monitor._id })
          .select(["status", "responseTime", "createdAt"])
          .limit(25)
          .sort({ createdAt: -1 }) // newest first
          .lean();
        return { ...monitor.toObject(), checks };
      })
    );
    return monitorsWithChecks;
  }

  async get(monitorId: string) {
    return Monitor.findById(monitorId);
  }

  async getEmbedChecks(
    monitorId: string,
    range: string,
    status: string | undefined
  ): Promise<MonitorWithChecksResponse> {
    const monitor = await Monitor.findById(monitorId);
    if (!monitor) {
      throw new ApiError("Monitor not found", 404);
    }
    const now = new Date();
    let startDate: Date;

    let groupClause: groupClauseType = {
      _id: { $dateToString: { format: "", date: "$createdAt" } },
      count: { $sum: 1 },
      avgResponseTime: { $avg: "$responseTime" },
    };

    switch (range) {
      case "30m":
        startDate = new Date(now.getTime() - 30 * 60 * 1000);
        groupClause._id.$dateToString.format = "%Y-%m-%dT%H:%M:00Z";
        break;
      case "24h":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        groupClause._id.$dateToString.format = "%Y-%m-%dT%H:00:00Z";
        break;
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        groupClause._id.$dateToString.format = "%Y-%m-%dT%H:00:00Z";
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        groupClause._id.$dateToString.format = "%Y-%m-%d";
        break;
      default:
        throw new ApiError("Invalid range parameter", 400);
    }

    // Build match stage
    const matchStage: {
      monitorId: mongoose.Types.ObjectId;
      createdAt: { $gte: Date };
      status?: string;
    } = {
      monitorId: monitor._id,
      createdAt: { $gte: startDate },
    };

    if (status) {
      matchStage.status = status;
    }

    const checks = await Check.aggregate([
      {
        $match: matchStage,
      },
      { $project: { status: 1, responseTime: 1, createdAt: 1 } },
      { $group: groupClause },
      { $sort: { _id: -1 } },
    ]);

    // Get monitor stats
    const monitorStats = await MonitorStats.findOne({
      monitorId: monitor._id,
    }).lean();

    if (!monitorStats) {
      throw new ApiError("Monitor stats not found", 404);
    }

    return {
      monitor: monitor.toObject(),
      checks,
      stats: monitorStats,
    };
  }

  async update(
    tokenizedUser: ITokenizedUser,
    monitorId: string,
    updateData: Partial<IMonitor>
  ) {
    const allowedFields: (keyof IMonitor)[] = [
      "name",
      "interval",
      "isActive",
      "n",
      "m",
    ];
    const safeUpdate: Partial<IMonitor> = {};

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        (safeUpdate as any)[field] = updateData[field];
      }
    }

    const monitor = await Monitor.findById(monitorId);
    if (!monitor) {
      throw new ApiError("Monitor not found", 404);
    }

    monitor.set({
      ...safeUpdate,
      updatedAt: new Date(),
      updatedBy: tokenizedUser.sub,
    });

    const updatedMonitor = await monitor.save();
    await this.jobQueue.updateJob(updatedMonitor);
    return updatedMonitor;
  }

  async delete(monitorId: string) {
    const monitor = await Monitor.findById(monitorId);
    if (!monitor) {
      throw new ApiError("Monitor not found", 404);
    }
    await monitor.deleteOne();
    await this.jobQueue.deleteJob(monitor);
  }
}

export default MonitorService;

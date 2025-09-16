import { ICheck, Check, Monitor } from "../../db/models/index.js";
import type { ISystemInfo, ICaptureInfo } from "../../db/models/index.js";
import { MonitorType } from "../../db/models/monitors/Monitor.js";
import { StatusResponse } from "../infrastructure/NetworkService.js";
import type { ICapturePayload } from "../infrastructure/NetworkService.js";
import mongoose from "mongoose";

export interface ICheckService {
  buildCheck: (
    statusResponse: StatusResponse,
    type: MonitorType
  ) => Promise<ICheck>;
  cleanupOrphanedChecks: () => Promise<boolean>;
}

class CheckService implements ICheckService {
  isCapturePayload = (payload: any): payload is ICapturePayload => {
    if (!payload || typeof payload !== "object") return false;

    // Check "data" exists and is an object
    if (!("data" in payload) || typeof payload.data !== "object") {
      return false;
    }

    // Minimal validation for system info
    const data = payload.data as Partial<ISystemInfo>;
    if (
      !data.cpu ||
      typeof data.cpu !== "object" ||
      typeof data.cpu.usage_percent !== "number"
    ) {
      return false;
    }

    if (
      !data.memory ||
      typeof data.memory !== "object" ||
      typeof data.memory.usage_percent !== "number"
    ) {
      return false;
    }

    // Disk and net should be arrays if present
    if (data.disk && !Array.isArray(data.disk)) {
      return false;
    }
    if (data.net && !Array.isArray(data.net)) {
      return false;
    }

    if (!("capture" in payload) || typeof payload.capture !== "object")
      return false;
    const capture = payload.capture as Record<string, any>;
    if (typeof capture.version !== "string" || typeof capture.mode !== "string")
      return false;

    return true;
  };

  buildCheck = async (
    statusResponse: StatusResponse,
    type: MonitorType
  ): Promise<ICheck> => {
    const monitorId = new mongoose.Types.ObjectId(statusResponse.monitorId);

    const check = new Check({
      monitorId: monitorId,
      type: statusResponse.type,
      status: statusResponse.status,
      message: statusResponse.message,
      responseTime: statusResponse.responseTime,
      timings: statusResponse.timings,
    });

    // If not a special type, we're done
    if (type !== "infrastructure") {
      return check;
    }

    switch (type) {
      case "infrastructure":
        if (!this.isCapturePayload(statusResponse.payload)) {
          throw new Error("Invalid payload for infrastructure monitor");
        }
        check.system = statusResponse.payload.data;
        check.capture = statusResponse.payload.capture;
        return check;
      default:
        throw new Error(`Unsupported monitor type: ${type}`);
    }
  };

  cleanupOrphanedChecks = async () => {
    try {
      const monitorIds = await Monitor.find().distinct("_id");
      const result = await Check.deleteMany({
        monitorId: { $nin: monitorIds },
      });
      console.log(`Deleted ${result.deletedCount} orphaned checks.`);
      return true;
    } catch (error) {
      console.error("Error cleaning up orphaned checks:", error);
      return false;
    }
  };
}

export default CheckService;

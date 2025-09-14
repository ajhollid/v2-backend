import { ICheck, Check, Monitor } from "../../db/models/index.js";
import { StatusResponse } from "../infrastructure/NetworkService.js";
import mongoose from "mongoose";

export interface ICheckService {
  buildCheck: (statusResponse: StatusResponse) => Promise<ICheck>;
  cleanupOrphanedChecks: () => Promise<boolean>;
}

class CheckService implements ICheckService {
  buildCheck = async (statusResponse: StatusResponse): Promise<ICheck> => {
    const monitorId = new mongoose.Types.ObjectId(statusResponse.monitorId);

    const check = new Check({
      monitorId: monitorId,
      type: statusResponse.type,
      status: statusResponse.status,
      message: statusResponse.message,
      responseTime: statusResponse.responseTime,
      timings: statusResponse.timings,
    });
    return check;
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

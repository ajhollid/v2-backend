import { IMonitor } from "../../db/models/index.js";
import { INetworkService } from "./NetworkService.js";
import { ICheckService } from "../business/CheckService.js";
import { IStatusService } from "./StatusService.js";
import ApiError from "../../utils/ApiError.js";

export interface IJobGenerator {
  generateJob: () => (Monitor: IMonitor) => Promise<void>;
  generateCleanupJob: () => () => Promise<void>;
}

class JobGenerator implements IJobGenerator {
  private networkService: INetworkService;
  private checkService: ICheckService;
  private statusService: IStatusService;

  constructor(
    networkService: INetworkService,
    checkService: ICheckService,
    statusService: IStatusService
  ) {
    this.networkService = networkService;
    this.checkService = checkService;
    this.statusService = statusService;
  }

  generateJob = () => {
    return async (monitor: IMonitor) => {
      try {
        const monitorId = monitor._id.toString();
        if (!monitorId) {
          throw new ApiError("No monitorID for creating job", 400);
        }
        const status = await this.networkService.requestStatus(monitor);
        const check = await this.checkService.buildCheck(status);
        await check.save();
        const [updatedMonitor, statusChanged] =
          await this.statusService.updateMonitorStatus(monitor, status);

        if (statusChanged) {
          console.log(
            `Monitor ${monitor._id} status changed to ${updatedMonitor.status}`
          );
        }
        await this.statusService.updateMonitorStats(updatedMonitor, status);
      } catch (error) {
        throw error;
      }
    };
  };

  generateCleanupJob = () => {
    return async () => {
      try {
        await this.checkService.cleanupOrphanedChecks();
      } catch (error) {
        throw error;
      }
    };
  };
}

export default JobGenerator;

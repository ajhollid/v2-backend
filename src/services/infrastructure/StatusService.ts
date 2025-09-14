//********************************
// This service handles updating monitor status
//********************************

import {
  IMonitor,
  IMonitorStats,
  MonitorStats,
} from "../../db/models/index.js";
import { StatusResponse } from "./NetworkService.js";
import ApiError from "../../utils/ApiError.js";
export interface IStatusService {
  updateMonitorStatus: (
    monitor: IMonitor,
    status: StatusResponse
  ) => Promise<StatusChangeResult>;

  calculateAvgResponseTime: (
    stats: IMonitorStats,
    statusResponse: StatusResponse
  ) => number;

  updateMonitorStats: (
    monitor: IMonitor,
    status: StatusResponse
  ) => Promise<IMonitorStats | null>;
}

export type StatusChangeResult = [
  updatedMonitor: IMonitor,
  statusChanged: boolean
];

class StatusService implements IStatusService {
  updateMonitorStatus = async (
    monitor: IMonitor,
    statusResponse: StatusResponse
  ): Promise<StatusChangeResult> => {
    const { n, m, lastStatuses } = monitor;
    const newStatus = statusResponse.status;
    monitor.lastStatuses.push(newStatus);
    while (monitor.lastStatuses.length > m) {
      monitor.lastStatuses.shift();
    }

    if (monitor.status === "initializing") {
      monitor.status = newStatus;
      return [await monitor.save(), true];
    } else {
      const mostRecentStatuses = monitor.lastStatuses.slice(-n);
      // Return early if not enough statuses to evaluate
      if (mostRecentStatuses.length < n) {
        return [await monitor.save(), false];
      }

      // If all different than current status, update status
      const allDifferent = mostRecentStatuses.every(
        (status) => status !== monitor.status
      );
      if (allDifferent && monitor.status !== newStatus) {
        monitor.status = newStatus;
      }
      return [await monitor.save(), allDifferent];
    }
  };

  calculateAvgResponseTime = (
    stats: IMonitorStats,
    statusResponse: StatusResponse
  ): number => {
    let avgResponseTime = stats.avgResponseTime;
    // Set initial
    if (avgResponseTime === 0) {
      avgResponseTime = statusResponse.responseTime;
    } else {
      avgResponseTime =
        (avgResponseTime * (stats.totalChecks - 1) +
          statusResponse.responseTime) /
        stats.totalChecks;
    }
    return avgResponseTime;
  };

  calculateUptimePercentage = (stats: IMonitorStats): number => {};

  updateMonitorStats = async (
    monitor: IMonitor,
    statusResponse: StatusResponse
  ) => {
    const stats = await MonitorStats.findOne({ monitorId: monitor._id });
    if (!stats) {
      throw new ApiError("MonitorStats not found", 500);
    }

    // Update check counts
    stats.totalChecks += 1;
    stats.totalUpChecks += statusResponse.status === "up" ? 1 : 0;
    stats.totalDownChecks += statusResponse.status === "down" ? 1 : 0;

    // Update time stamps
    stats.lastCheckTimestamp = Date.now();
    stats.timeOfLastFailure =
      statusResponse.status === "down" ? Date.now() : stats.timeOfLastFailure;

    // Update stats that need updated check counts
    stats.avgResponseTime = this.calculateAvgResponseTime(
      stats,
      statusResponse
    );
    stats.uptimePercentage = stats.totalUpChecks / stats.totalChecks;

    // Other
    stats.lastResponseTime = statusResponse.responseTime;

    return await stats.save();
  };
}

export default StatusService;

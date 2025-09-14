import { Got } from "got";
import { IMonitor } from "../../db/models/index.js";
import { GotTimings } from "../../db/models/monitors/Check.js";
import type { Response } from "got";
import {
  MonitorType,
  MonitorStatus,
} from "../../db/models/monitors/Monitor.js";
export interface INetworkService {
  requestHttp: (monitor: IMonitor) => Promise<StatusResponse>;
  requestStatus: (monitor: IMonitor) => Promise<StatusResponse>;
}

export type StatusResponse = {
  monitorId: string;
  type: MonitorType;
  code: number;
  status: MonitorStatus;
  message: string;
  responseTime: number;
  timings: GotTimings;
};

class NetworkService implements INetworkService {
  private got: Got;
  private NETWORK_ERROR: number;
  constructor(got: Got) {
    this.got = got;
    this.NETWORK_ERROR = 5000;
  }

  requestHttp = async (monitor: IMonitor) => {
    try {
      const url = monitor.url;
      if (!url) {
        throw new Error("No URL provided");
      }

      const response: Response = await this.got(url);
      const statusResponse: StatusResponse = {
        monitorId: monitor._id.toString(),
        type: monitor.type,
        code: response.statusCode,
        status: response.ok === true ? "up" : "down",
        message: response.statusMessage || "",
        responseTime: response.timings.phases.total || 0,
        timings: response.timings,
      };
      return statusResponse;
    } catch (error: any) {
      if (error.name === "HTTPError" || error.name === "RequestError") {
        const statusResponse: StatusResponse = {
          monitorId: monitor._id.toString(),
          type: monitor.type,
          code: error?.response?.statusCode || this.NETWORK_ERROR,
          status: "down",
          message: error.response?.statusCode || error.message,
          responseTime: error.timings?.phases?.total || 0,
          timings: error.timings,
        };

        return statusResponse;
      }
      throw error;
    }
  };

  requestStatus = async (monitor: IMonitor) => {
    switch (monitor.type) {
      case "http":
        return await this.requestHttp(monitor);
      case "https":
        return await this.requestHttp(monitor);
      default:
        throw new Error("Not implemented");
    }
  };
}
export default NetworkService;

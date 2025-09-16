import { Got } from "got";
import { IMonitor } from "../../db/models/index.js";
import { GotTimings } from "../../db/models/monitors/Check.js";
import type { Response } from "got";
import type { ISystemInfo, ICaptureInfo } from "../../db/models/index.js";
import {
  MonitorType,
  MonitorStatus,
} from "../../db/models/monitors/Monitor.js";
import ApiError from "../../utils/ApiError.js";
export interface INetworkService {
  requestHttp: (monitor: IMonitor) => Promise<StatusResponse>;
  requestInfrastructure: (monitor: IMonitor) => Promise<StatusResponse>;
  requestStatus: (monitor: IMonitor) => Promise<StatusResponse>;
}

export interface ICapturePayload {
  data: ISystemInfo;
  capture: ICaptureInfo;
}

export type StatusResponse = {
  monitorId: string;
  type: MonitorType;
  code: number;
  status: MonitorStatus;
  message: string;
  responseTime: number;
  timings: GotTimings;
  payload?: ICapturePayload;
};

class NetworkService implements INetworkService {
  private got: Got;
  private NETWORK_ERROR: number;
  constructor(got: Got) {
    this.got = got;
    this.NETWORK_ERROR = 5000;
  }

  buildStatusResponse = (
    monitor: IMonitor,
    response: Response
  ): StatusResponse => {
    try {
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
      const statusResponse = {
        monitorId: monitor._id.toString(),
        type: monitor.type,
        status: "down" as MonitorStatus,
        code: this.NETWORK_ERROR,
        message: error.message || "Network error",
        responseTime: error.timings?.phases?.total || 0,
        timings: error.timings || { phases: {} },
      };
      if (error.name === "HTTPError" || error.name === "RequestError") {
        statusResponse.code = error?.response?.statusCode || this.NETWORK_ERROR;
        statusResponse.message = error.response?.statusCode || error.message;
        statusResponse.responseTime = error.timings?.phases?.total || 0;
        statusResponse.timings = error.timings;
      }
      return statusResponse;
    }
  };

  requestHttp = async (monitor: IMonitor) => {
    try {
      const url = monitor.url;
      if (!url) {
        throw new Error("No URL provided");
      }

      const response: Response = await this.got(url);
      return this.buildStatusResponse(monitor, response);
    } catch (error) {
      throw error;
    }
  };

  requestInfrastructure = async (monitor: IMonitor) => {
    const url = monitor.url;
    if (!url) {
      throw new Error("No URL provided");
    }
    const secret = monitor.secret;
    if (!secret) {
      throw new Error("No secret provided for infrastructure monitor");
    }

    const response: Response<ICapturePayload> = await this.got(url, {
      headers: { Authorization: `Bearer ${secret}` },
      responseType: "json",
    });

    const statusResponse = this.buildStatusResponse(monitor, response);
    const payload = response.body;
    if (payload) {
      statusResponse.payload = payload;
      return statusResponse;
    } else {
      throw new ApiError(
        "No payload received from infrastructure monitor",
        500
      );
    }
  };

  requestStatus = async (monitor: IMonitor) => {
    switch (monitor.type) {
      case "http":
        return await this.requestHttp(monitor);
      case "https":
        return await this.requestHttp(monitor);
      case "infrastructure":
        return await this.requestInfrastructure(monitor);
      default:
        throw new Error("Not implemented");
    }
  };
}
export default NetworkService;

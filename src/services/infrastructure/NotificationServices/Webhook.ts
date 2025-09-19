import { IMonitor, INotificationChannel } from "../../../db/models/index.js";
import { IAlert, IMessageService } from "./IMessageService.js";
import ApiError from "../../../utils/ApiError.js";
import got from "got";
class WebhookService implements IMessageService {
  constructor() {}

  buildMessage = (monitor: IMonitor) => {
    const name = monitor?.name || "Unnamed monitor";
    const monitorStatus = monitor?.status || "unknown status";
    const url = monitor?.url || "no URL";
    const checkTime = monitor?.lastCheckedAt || null;
    const alertTime = new Date();
    return {
      name,
      url,
      status: monitorStatus,
      checkTime,
      alertTime,
    };
  };

  sendMessage = async (
    message: string | IAlert,
    channel: INotificationChannel
  ) => {
    const notificationUrl = channel?.config?.url;
    if (!notificationUrl) {
      throw new ApiError("Webhook URL not configured", 400);
    }

    if (typeof message === "string") {
      throw new ApiError("Invalid message format for webhook", 400);
    }
    await got.post(notificationUrl, { json: { ...message } });

    return true;
  };

  testMessage = async () => {
    return true;
  };
}

export default WebhookService;

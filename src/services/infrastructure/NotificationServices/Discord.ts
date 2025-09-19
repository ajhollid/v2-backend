import { IMonitor, INotificationChannel } from "../../../db/models/index.js";
import { IAlert, IMessageService } from "./IMessageService.js";
import got from "got";
import ApiError from "../../../utils/ApiError.js";
class DiscordService implements IMessageService {
  constructor() {}

  private toDiscordEmbeds = (alert: IAlert) => {
    return {
      color: alert.status === "up" ? 65280 : 16711680,
      title: `Monitor name: ${alert.name}`,
      description: `Status: **${alert.status}**`,
      fields: [
        {
          name: "Url",
          value: alert.url,
        },
        {
          name: "Checked at",
          value: alert.checkTime ? alert.checkTime.toISOString() : "N/A",
        },
        { name: "Alert time", value: alert.alertTime.toISOString() },
        ...(alert.details
          ? Object.entries(alert.details).map(([key, value]) => ({
              name: key,
              value,
            }))
          : []),
      ],
    };
  };

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

    try {
      if (typeof message === "string") {
        await got.post(notificationUrl, {
          json: { content: message },
        });
        return true;
      }

      const payload = {
        content: "Status Alert",
        embeds: [this.toDiscordEmbeds(message)],
      };
      await got.post(notificationUrl, { json: payload });
    } catch (error) {
      console.warn("Failed to send Discord message", error);
      return false;
    }

    return true;
  };

  testMessage = async () => {
    return true;
  };
}

export default DiscordService;

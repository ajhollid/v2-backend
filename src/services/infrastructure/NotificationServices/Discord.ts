import { IMonitor, INotificationChannel } from "../../../db/models/index.js";
import { IMessageService } from "./IMessageService.js";

class DiscordService implements IMessageService {
  constructor() {}

  buildMessage = (monitor: IMonitor) => {
    return `Discord notification for monitor: ${monitor._id}`;
  };

  sendMessage = async (message: string, channel: INotificationChannel) => {
    console.log("Sending Discord message:", message);
    return true;
  };

  testMessage = async () => {
    return true;
  };
}

export default DiscordService;

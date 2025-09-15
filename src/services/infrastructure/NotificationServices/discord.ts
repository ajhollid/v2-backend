import { IMonitor } from "../../../db/models/index.js";
import { IMessageService } from "./index.js";

class DiscordService implements IMessageService {
  constructor() {}

  buildMessage = (monitor: IMonitor) => {
    return `Discord notification for monitor: ${monitor._id}`;
  };

  sendMessage = async (message: string) => {
    console.log("Sending Discord message:", message);
    return true;
  };

  testMessage = async () => {
    return true;
  };
}

export default DiscordService;

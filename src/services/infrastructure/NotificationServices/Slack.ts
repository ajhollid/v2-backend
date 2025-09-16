import { IMonitor } from "../../../db/models/index.js";
import { IMessageService } from "./IMessageService.js";

class SlackService implements IMessageService {
  constructor() {}

  buildMessage = (monitor: IMonitor) => {
    return `Slack notification for monitor: ${monitor._id}`;
  };

  sendMessage = async (message: string) => {
    console.log("Sending Slack message:", message);
    return true;
  };

  testMessage = async () => {
    return true;
  };
}

export default SlackService;

import { IMonitor } from "../../../db/models/index.js";
import { IMessageService } from "./index.js";

class WebhookService implements IMessageService {
  constructor() {}

  buildMessage = (monitor: IMonitor) => {
    return `Webhook notification for monitor: ${monitor._id}`;
  };

  sendMessage = async (message: string) => {
    console.log("Sending Webhook message:", message);
    return true;
  };

  testMessage = async () => {
    return true;
  };
}

export default WebhookService;

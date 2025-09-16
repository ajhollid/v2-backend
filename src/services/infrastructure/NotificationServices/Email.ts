import { IMonitor } from "../../../db/models/index.js";
import { IMessageService } from "./IMessageService.js";

class EmailService implements IMessageService {
  constructor() {}

  buildMessage = (monitor: IMonitor) => {
    return `Email notification for monitor: ${monitor._id}`;
  };

  sendMessage = async (message: string) => {
    console.log("Sending email with message:", message);
    return true;
  };

  testMessage = async () => {
    return true;
  };
}

export default EmailService;

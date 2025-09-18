import { IMonitor, INotificationChannel } from "../../../db/models/index.js";

export interface IMessageService {
  buildMessage: (monitor: IMonitor) => string;
  sendMessage: (
    message: string,
    channel: INotificationChannel
  ) => Promise<boolean>;
  testMessage: (monitor: IMonitor, message: string) => Promise<boolean>;
}

import { string } from "joi";
import { IMonitor, INotificationChannel } from "../../../db/models/index.js";

export interface IAlert {
  name: string;
  url: string;
  status: string;
  checkTime: Date | null;
  alertTime: Date;
}
export interface IMessageService {
  buildMessage: (monitor: IMonitor) => string | IAlert;
  sendMessage: (
    message: string | IAlert,
    channel: INotificationChannel
  ) => Promise<boolean>;
  testMessage: (
    monitor: IMonitor,
    message: string | IAlert
  ) => Promise<boolean>;
}

import { IMonitor } from "../../../db/models/index.js";

export interface IMessageService {
  buildMessage: (monitor: IMonitor) => string;
  sendMessage: (message: string) => Promise<boolean>;
  testMessage: (monitor: IMonitor, message: string) => Promise<boolean>;
}

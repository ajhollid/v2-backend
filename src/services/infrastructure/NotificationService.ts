import UserService from "../business/UserService.js";
import { IMonitor, NotificationChannel } from "../../db/models/index.js";
import {
  EmailService,
  SlackService,
  DiscordService,
  WebhookService,
} from "./NotificationServices/index.js";
export interface INotificationService {
  handleNotifications: (monitor: IMonitor) => Promise<void>;
}

class NotificationService implements INotificationService {
  private emailService: EmailService;
  private slackService: SlackService;
  private discordService: DiscordService;
  private webhookService: WebhookService;
  private userService: UserService;

  constructor(userService: UserService) {
    this.userService = userService;
    this.emailService = new EmailService(userService);
    this.slackService = new SlackService();
    this.discordService = new DiscordService();
    this.webhookService = new WebhookService();
  }

  handleNotifications = async (monitor: IMonitor) => {
    const notificationIds = monitor.notificationChannels || [];

    if (notificationIds.length === 0) {
      return;
    }

    const notificationChannels = await NotificationChannel.find({
      _id: { $in: notificationIds },
    });

    for (const channel of notificationChannels) {
      // Implement sending logic based on channel.type and channel.config
      let service;
      switch (channel.type) {
        case "email":
          await this.emailService.sendMessage(
            this.emailService.buildMessage(monitor)
          );
          break;
        case "slack":
          await this.slackService.sendMessage(
            this.slackService.buildMessage(monitor)
          );
          break;
        case "discord":
          await this.discordService.sendMessage(
            this.discordService.buildMessage(monitor)
          );
          break;
        case "webhook":
          await this.webhookService.sendMessage(
            this.webhookService.buildMessage(monitor),
            channel
          );
          break;
        default:
          console.warn(`Unknown notification channel type: ${channel.type}`);
      }
    }
    return;
  };
}

export default NotificationService;

import { IMonitor } from "../../../db/models/index.js";
import { IMessageService } from "./IMessageService.js";
import nodemailer, { Transporter } from "nodemailer";
import { config } from "../../../config/index.js";
import UserService from "../../business/UserService.js";
class EmailService implements IMessageService {
  private transporter: Transporter;
  private userService: UserService;
  constructor(userService: UserService) {
    this.userService = userService;
    this.transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_PORT === 465,
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS,
      },
    });
  }

  buildMessage = (monitor: IMonitor) => {
    return `Email notification for monitor: ${monitor._id}`;
  };

  sendMessage = async (message: string) => {
    try {
      const users = await this.userService.getAllUsers();
      const emails = users.map((u) => u.email).join(",");
      await this.transporter.sendMail({
        from: `"Checkmate" <${config.SMTP_USER}>`,
        to: emails,
        subject: "Monitor Alert",
        text: message,
      });
      return true;
    } catch (error) {
      return false;
    }
  };

  testMessage = async () => {
    return true;
  };
}

export default EmailService;

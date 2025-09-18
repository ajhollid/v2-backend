import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import AuthRoutes from "./routes/auth.js";
import AuthController from "./controllers/AuthController.js";
import AuthService from "./services/business/AuthService.js";

import MonitorRoutes from "./routes/monitors.js";
import MonitorController from "./controllers/MonitorController.js";
import MonitorService from "./services/business/MonitorService.js";

import QueueRoutes from "./routes/queue.js";
import QueueController from "./controllers/QueueController.js";
import QueueService from "./services/business/QueueService.js";

import NotificationChannelRoutes from "./routes/notificationChannel.js";
import NotificationChannelController from "./controllers/NotificationChannelController.js";
import NotificationChannelService from "./services/business/NotificationChannelService.js";

import MaintenanceRoutes from "./routes/maintenance..js";
import MaintenanceController from "./controllers/MaintenanceController.js";
import MaintenanceService from "./services/business/MaintenanceService.js";

import InviteRoutes from "./routes/invite.js";
import InviteController from "./controllers/InviteController.js";
import InviteService from "./services/business/InviteService.js";

import { errorHandler } from "./middleware/ErrorHandler.js";
import { IJobQueue } from "./services/infrastructure/JobQueue.js";

const init = (jobQueue: IJobQueue) => {
  const app = express();
  const v1ApiRouter = express.Router();
  v1ApiRouter.get("/health", (req, res) =>
    res.status(200).json({ message: "OK" })
  );
  app.use(express.json());
  app.use(cookieParser());
  app.use(
    cors({
      origin: "http://localhost:5173",
      credentials: true,
    })
  );

  const authService = new AuthService();
  const authController = new AuthController(authService);
  const authRouter = new AuthRoutes(authController);
  v1ApiRouter.use("/auth", authRouter.getRouter());

  const monitorService = new MonitorService(jobQueue);
  const monitorController = new MonitorController(monitorService);
  const monitorRouter = new MonitorRoutes(monitorController);
  v1ApiRouter.use("/monitors", monitorRouter.getRouter());

  const queueService = new QueueService(jobQueue);
  const queueController = new QueueController(queueService);
  const queueRouter = new QueueRoutes(queueController);
  v1ApiRouter.use("/queue", queueRouter.getRouter());

  const notificationChannelService = new NotificationChannelService();
  const notificationChannelController = new NotificationChannelController(
    notificationChannelService
  );
  const notificationChannelRouter = new NotificationChannelRoutes(
    notificationChannelController
  );
  v1ApiRouter.use(
    "/notification-channels",
    notificationChannelRouter.getRouter()
  );

  const maintenanceService = new MaintenanceService();
  const maintenanceController = new MaintenanceController(maintenanceService);
  const maintenanceRouter = new MaintenanceRoutes(maintenanceController);
  v1ApiRouter.use("/maintenance", maintenanceRouter.getRouter());

  const inviteService = new InviteService();
  const inviteController = new InviteController(inviteService);
  const inviteRouter = new InviteRoutes(inviteController);
  v1ApiRouter.use("/invite", inviteRouter.getRouter());

  app.use("/api/v1", v1ApiRouter);
  app.use(errorHandler);
  return app;
};

export default init;

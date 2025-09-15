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

import NotificationChannelRoutes from "./routes/notifications.js";
import NotificationController from "./controllers/NotificationController.js";
import NotificationService from "./services/business/NotificationService.js";

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

  const notificationChannelService = new NotificationService();
  const notificationChannelController = new NotificationController(
    notificationChannelService
  );
  const notificationChannelRouter = new NotificationChannelRoutes(
    notificationChannelController
  );
  v1ApiRouter.use("/notifications", notificationChannelRouter.getRouter());

  app.use("/api/v1", v1ApiRouter);
  app.use(errorHandler);
  return app;
};

export default init;

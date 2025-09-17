import { connectDatabase, disconnectDatabase } from "./db/index.js";
import CheckService from "./services/business/CheckService.js";
import MonitorStatsService from "./services/business/MonitorStatsService.js";
import NetworkService from "./services/infrastructure/NetworkService.js";
import StatusService from "./services/infrastructure/StatusService.js";
import NotificationService from "./services/infrastructure/NotificationService.js";
import MaintenanceService from "./services/business/MaintenanceService.js";
import JobQueue, { IJobQueue } from "./services/infrastructure/JobQueue.js";
import JobGenerator from "./services/infrastructure/JobGenerator.js";
import initApp from "./app.js";
import got from "got";
import { config } from "./config/index.js";

const PORT = config.PORT;
let jobQueue: IJobQueue;

const startServer = async () => {
  await connectDatabase();
  const networkService = new NetworkService(got);
  const checkService = new CheckService();
  const monitorStatsService = new MonitorStatsService();
  const statusService = new StatusService();
  const notificationService = new NotificationService();
  const maintenanceService = new MaintenanceService();
  const jobGenerator = new JobGenerator(
    networkService,
    checkService,
    monitorStatsService,
    statusService,
    notificationService,
    maintenanceService
  );
  jobQueue = await JobQueue.create(jobGenerator);
  const app = initApp(jobQueue);
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

const stopServer = async () => {
  await disconnectDatabase();
  await jobQueue.shutdown();
  process.exit(0);
};

process.on("SIGTERM", stopServer);
process.on("SIGINT", stopServer);

startServer();

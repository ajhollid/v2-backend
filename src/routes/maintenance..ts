import { Router } from "express";
import MaintenanceController from "../controllers/MaintenanceController.js";
import { verifyToken } from "../middleware/VerifyToken.js";
import { verifyPermission } from "../middleware/VerifyPermissions.js";

class MaintenanceRoutes {
  private router;
  private controller;
  constructor(maintenanceController: MaintenanceController) {
    this.router = Router();
    this.controller = maintenanceController;
    this.initRoutes();
  }

  initRoutes = () => {
    this.router.post(
      "/",
      verifyToken,
      verifyPermission(["maintenance.create"]),
      this.controller.create
    );

    this.router.get(
      "/",
      verifyToken,
      verifyPermission(["maintenance.view"]),
      this.controller.getAll
    );

    this.router.patch(
      "/:id/active",
      verifyToken,
      verifyPermission(["maintenance.update"]),
      this.controller.toggleActive
    );

    this.router.patch(
      "/:id",
      verifyToken,
      verifyPermission(["maintenance.update"]),
      this.controller.update
    );

    this.router.get(
      "/:id",
      verifyToken,
      verifyPermission(["maintenance.view"]),
      this.controller.get
    );

    this.router.delete(
      "/:id",
      verifyToken,
      verifyPermission(["maintenance.delete"]),
      this.controller.delete
    );
  };

  getRouter() {
    return this.router;
  }
}

export default MaintenanceRoutes;

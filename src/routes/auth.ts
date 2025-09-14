import { Router } from "express";

import express from "express";
import AuthController from "../controllers/AuthController.js";
import { verifyToken } from "../middleware/VerifyToken.js";

const router = express.Router();

class AuthRoutes {
  private controller: AuthController;
  private router: Router;
  constructor(authController: AuthController) {
    this.controller = authController;
    this.router = Router();
    this.initRoutes();
  }

  initRoutes = () => {
    this.router.post("/register", this.controller.register);
    this.router.post("/login", this.controller.login);
    this.router.post("/logout", this.controller.logout);
    this.router.get("/me", verifyToken, this.controller.me);
    this.router.post("/cleanup", this.controller.cleanup);
    this.router.post("/cleanup-monitors", this.controller.cleanMonitors);
  };

  getRouter() {
    return this.router;
  }
}

export default AuthRoutes;

import { Request, Response, NextFunction } from "express";
import { encode, decode } from "../utils/JWTUtils.js";
import AuthService from "../services/business/AuthService.js";

class AuthController {
  private authService: AuthService;
  constructor(authService: AuthService) {
    this.authService = authService;
  }

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, firstName, lastName, password } = req.body;

      if (!email || !firstName || !lastName || !password) {
        throw new Error(
          "Email, firstName, lastName, and password are required"
        );
      }

      const result = await this.authService.register({
        email,
        firstName,
        lastName,
        password,
      });

      const token = encode(result);

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
      });

      res.status(201).json({
        message: "User and  created successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      // Validation
      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email and password are required" });
      }
      const result = await this.authService.login({ email, password });
      const token = encode(result);

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
      });

      res.status(200).json({
        message: "Login successful",
      });
    } catch (error) {
      next(error);
    }
  };

  logout = (req: Request, res: Response) => {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    res.status(200).json({ message: "Logout successful" });
  };

  me = (req: Request, res: Response, next: NextFunction) => {
    return res.status(200).json({ message: "OK" });
  };

  cleanup = async (req: Request, res: Response) => {
    try {
      await this.authService.cleanup();
      res.status(200).json({ message: "Cleanup successful" });
    } catch (error) {}
  };

  cleanMonitors = async (req: Request, res: Response) => {
    try {
      await this.authService.cleanMonitors();
      res.status(200).json({ message: "Monitors cleanup successful" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  };
}

export default AuthController;

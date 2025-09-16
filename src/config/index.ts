import dotenv from "dotenv";

export interface IEevConfig {
  NODE_ENV: string;
  JWT_SECRET: string;
  PORT: number;
  PAGESPEED_API_KEY: string;
}

dotenv.config();

export const config: IEevConfig = {
  NODE_ENV: process.env.NODE_ENV || "development",
  JWT_SECRET: process.env.JWT_SECRET || "your_jwt_secret",
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  PAGESPEED_API_KEY: process.env.PAGESPEED_API_KEY || "",
};

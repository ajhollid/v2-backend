import { Request, Response, NextFunction } from "express";

interface ErrorResponse {
  error: {
    message: string;
    status: number;
    timestamp: string;
  };
}

const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error(err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  const errorResponse: ErrorResponse = {
    error: {
      message,
      status,
      timestamp: new Date().toISOString(),
    },
  };

  if (process.env.NODE_ENV === "development") {
    console.error("Error:", err);
  }

  res.status(status).json(errorResponse);
};

export { errorHandler };

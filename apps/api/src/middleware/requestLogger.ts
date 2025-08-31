import { Request, Response, NextFunction } from "express";
import { log } from "@repo/logger";

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  // Skip logging for health checks and static files
  if (req.path === '/api/health/status' || req.path.startsWith('/static/')) {
    return next();
  }

  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;

    // Only log requests that took more than 100ms or have errors
    if (duration > 100 || res.statusCode >= 400) {
      log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    }
  });

  next();
};

export default requestLogger;

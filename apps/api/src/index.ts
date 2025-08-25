import 'dotenv/config';
import { log } from "@repo/logger";
import { createApp } from "./app";
import { appConfig } from "./config/app";

const app = createApp();
const { port } = appConfig;

const server = app.listen(port, 'localhost', () => {
  log(`🚀 API server running on port ${port}`);
  log(`📊 Health check: http://localhost:${port}/api/health/status`);
  log(`💬 Messages: http://localhost:${port}/api/message/:name`);
  log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});

server.on('error', (err) => {
  log(`❌ Server error: ${err.message}`);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  log("SIGINT received, shutting down gracefully");
  process.exit(0);
});

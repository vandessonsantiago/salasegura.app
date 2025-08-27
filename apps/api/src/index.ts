import 'dotenv/config';
import { log } from "@repo/logger";
import { createApp } from "./app";
import { appConfig } from "./config/app";

const app = createApp();
const { port } = appConfig;

log(`Starting server on port ${port}...`);

const server = app.listen(port, '0.0.0.0', () => {
  log(`🚀 API server running on port ${port}`);
  log(`📊 Health check: http://localhost:${port}/api/health/status`);
  log(`💬 Messages: http://localhost:${port}/api/message/:name`);
  log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  log(`Server listening callback executed successfully`);
});

server.on('error', (err) => {
  log(`❌ Server error: ${err.message}`);
  log(`❌ Error stack: ${err.stack}`);
  process.exit(1);
});

server.on('listening', () => {
  log(`✅ Server is now listening on port ${port}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  log(`❌ Uncaught Exception: ${err.message}`);
  log(`❌ Exception stack: ${err.stack}`);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  log(`❌ Unhandled Rejection at: ${promise}, reason: ${reason}`);
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

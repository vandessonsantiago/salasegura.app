import { json, urlencoded } from "body-parser";
import { type Express, Request, Response } from "express";
import morgan from "morgan";
import cors from "cors";
import routes from "./routes";
import authRoutes from "./routes/auth";
import protectedRoutes from "./routes/protected";
import chatRoutes from "./routes/chat";
import conversionsRoutes from "./routes/conversions";
import dashboardChatRoutes from "./routes/dashboardChat";
import checklistRoutes from "./routes/checklist";
import { errorHandler } from "./middleware/errorHandler";
const express = require('express');
import { requestLogger } from "./middleware/requestLogger";

export const createApp = (): Express => {
  const app = express();

  // Middleware básicos
  app.disable("x-powered-by");
  app.use(morgan("dev"));
  app.use(urlencoded({ extended: true }));
  app.use(json());
  
  // CORS configurado para aceitar o frontend
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Middleware customizado de logging
  app.use(requestLogger);

  // ------------------------------------------------------------------
  // Rotas (LEGADO) sem versão - manter temporariamente para compatibilidade
  // ------------------------------------------------------------------
  app.use("/api/auth", authRoutes);
  app.use("/api/user", protectedRoutes);
  app.use("/api/chat", chatRoutes);
  app.use("/api/dashboard-chat", dashboardChatRoutes);
  app.use("/api/conversions", conversionsRoutes);
  app.use("/api/checklist", checklistRoutes);
  app.use("/api", routes);

  // ------------------------------------------------------------------
  // Rotas versão 1 (novo padrão): /api/v1/*
  // Mantém mesma instância de handlers para não duplicar lógica
  // ------------------------------------------------------------------
  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/user", protectedRoutes);
  app.use("/api/v1/chat", chatRoutes);
  app.use("/api/v1/dashboard-chat", dashboardChatRoutes);
  app.use("/api/v1/conversions", conversionsRoutes);
  app.use("/api/v1/checklist", checklistRoutes);
  app.use("/api/v1", routes); // inclui /health, /message, etc.

  // Rotas de compatibilidade (mantendo as antigas rotas no root)
  app.get("/status", (req: Request, res: Response) => res.redirect("/api/health/status"));
  app.get("/message/:name", (req: Request, res: Response) => res.redirect(`/api/message/${req.params.name}`));

  // Middleware de tratamento de erros (deve ser o último)
  app.use(errorHandler);

  return app;
};

export default createApp;

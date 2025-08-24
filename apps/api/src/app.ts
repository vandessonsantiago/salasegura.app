import { json, urlencoded } from "body-parser";
import { type Express, Request, Response } from "express";
import morgan from "morgan";
import cors from "cors";
import routes from "./routes";
import authRoutes from "./routes/auth";
import protectedRoutes from "./routes/protected";
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

  // Rotas de autenticação
  app.use("/api/auth", authRoutes);

  // Rotas protegidas
  app.use("/api/user", protectedRoutes);

  // Rotas principais
  app.use("/api", routes);

  // Rotas de compatibilidade (mantendo as antigas rotas no root)
  app.get("/status", (req: Request, res: Response) => res.redirect("/api/health/status"));
  app.get("/message/:name", (req: Request, res: Response) => res.redirect(`/api/message/${req.params.name}`));

  // Middleware de tratamento de erros (deve ser o último)
  app.use(errorHandler);

  return app;
};

export default createApp;

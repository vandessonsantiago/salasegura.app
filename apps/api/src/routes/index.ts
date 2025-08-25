import { Router } from "express";
import healthRoutes from "./healthRoutes";
import messageRoutes from "./messageRoutes";
import userRoutes from "./userRoutes";

const router: Router = Router();

// Definição das rotas principais
router.use("/health", healthRoutes);
router.use("/message", messageRoutes);
router.use("/user", userRoutes);

// Rota de status legada (mantendo compatibilidade)
router.get("/status", (req, res) => {
  res.redirect("/health/status");
});

export default router;

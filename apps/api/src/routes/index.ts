import { Router } from "express";
import healthRoutes from "./healthRoutes";
import messageRoutes from "./messageRoutes";

const router: Router = Router();

// Definição das rotas principais
router.use("/health", healthRoutes);
router.use("/message", messageRoutes);

// Rota de status legada (mantendo compatibilidade)
router.get("/status", (req, res) => {
  res.redirect("/health/status");
});

export default router;

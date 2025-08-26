import { Router } from "express";
import healthRoutes from "./healthRoutes";
import messageRoutes from "./messageRoutes";
import userRoutes from "./userRoutes";
import agendamentosRoutes from "./agendamentos";
import availableSlotsRoutes from "./availableSlots";
import checkoutRoutes from "./checkout";
import asaasWebhookRoutes from "./asaasWebhook";

const router: Router = Router();

// Definição das rotas principais
router.use("/health", healthRoutes);
router.use("/message", messageRoutes);
router.use("/user", userRoutes);
router.use("/agendamentos", agendamentosRoutes);
router.use("/available-slots", availableSlotsRoutes);
router.use("/checkout", checkoutRoutes);
router.use("/asaas-webhook", asaasWebhookRoutes);

// Rota de status legada (mantendo compatibilidade)
router.get("/status", (req, res) => {
  res.redirect("/health/status");
});

export default router;

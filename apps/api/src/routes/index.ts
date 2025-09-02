import { Router } from "express";
import healthRoutes from "./healthRoutes";
import messageRoutes from "./messageRoutes";
import userRoutes from "./userRoutes";
import availableSlotsRoutes from "./availableSlots";
import checkoutRoutes from "./checkout";
import asaasWebhookRoutes from "./asaasWebhook";
import divorcioRoutes from "./divorcioRoutes";
import { feedbackRouter } from "../feedback";
import { agendamentoRouter } from "../agendamentos";

const router: Router = Router();

// Definição das rotas principais
router.use("/health", healthRoutes);
router.use("/message", messageRoutes);
router.use("/user", userRoutes);
router.use("/agendamentos", agendamentoRouter);
router.use("/available-slots", availableSlotsRoutes);
router.use("/checkout", checkoutRoutes);
router.use("/asaas-webhook", asaasWebhookRoutes);
router.use("/divorcio", divorcioRoutes);
router.use("/feedback", feedbackRouter);

// Rota de status legada (mantendo compatibilidade)
router.get("/status", (req, res) => {
  res.redirect("/health/status");
});

export default router;

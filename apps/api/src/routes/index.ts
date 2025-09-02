import { Router } from "express";
import healthRoutes from "./healthRoutes";
import messageRoutes from "./messageRoutes";
import userRoutes from "./userRoutes";
import agendamentosRoutes from "./agendamentos";
import agendamentoRoutes from "./agendamento";
import agendamentoRoutesNew from "./agendamentoRoutes";
import availableSlotsRoutes from "./availableSlots";
import checkoutRoutes from "./checkout";
import asaasWebhookRoutes from "./asaasWebhook";
import divorcioRoutes from "./divorcioRoutes";
import { feedbackRouter } from "../feedback";

const router: Router = Router();

// Definição das rotas principais
router.use("/health", healthRoutes);
router.use("/message", messageRoutes);
router.use("/user", userRoutes);
router.use("/agendamentos", agendamentosRoutes);
router.use("/agendamento", agendamentoRoutes);
router.use("/agendamento-new", agendamentoRoutesNew);
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

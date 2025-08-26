import { Router } from "express";
import { AgendamentosController } from "../controllers/AgendamentosController";
import { authenticateToken } from "../middleware/auth";

const router: Router = Router();

// Aplicar middleware de autenticação a todas as rotas
router.use(authenticateToken);

// Rotas para agendamentos
router.get("/", AgendamentosController.getUserAgendamentos);
router.post("/", AgendamentosController.createAgendamento);
router.get("/:id", AgendamentosController.getAgendamento);
router.put("/:id", AgendamentosController.updateAgendamento);
router.delete("/:id", AgendamentosController.deleteAgendamento);

export default router;

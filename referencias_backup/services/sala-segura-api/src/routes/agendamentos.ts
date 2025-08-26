// Make this file a module for TypeScript
export {}
const express = require("express")
const { AgendamentosController } = require("../controllers/agendamentos")
const authenticateToken = require("../middleware/auth")

const router = express.Router()

// Todas as rotas requerem autenticação
router.use(authenticateToken)

// GET /api/v1/agendamentos - Buscar todos os agendamentos do usuário
router.get("/", AgendamentosController.getUserAgendamentos)

// GET /api/v1/agendamentos/:id - Buscar agendamento específico
router.get("/:id", AgendamentosController.getAgendamento)

// POST /api/v1/agendamentos - Criar novo agendamento
router.post("/", AgendamentosController.createAgendamento)

// PUT /api/v1/agendamentos/:id - Atualizar agendamento
router.put("/:id", AgendamentosController.updateAgendamento)

// DELETE /api/v1/agendamentos/:id - Deletar agendamento
router.delete("/:id", AgendamentosController.deleteAgendamento)

// PUT /api/v1/agendamentos/payment-status/:payment_id - Atualizar status do pagamento
router.put(
  "/payment-status/:payment_id",
  AgendamentosController.updatePaymentStatus
)

// POST /api/v1/agendamentos/cancel-expired - Cancelar agendamentos expirados
router.post("/cancel-expired", AgendamentosController.cancelExpiredAgendamentos)

module.exports = router

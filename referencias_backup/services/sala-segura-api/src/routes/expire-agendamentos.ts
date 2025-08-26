const express = require("express")
import { expireAgendamentos } from "../utils/expire-agendamentos"

const router = express.Router()

// Rota POST /api/expire-agendamentos
router.post("/", async (req, res) => {
  try {
    console.log("🕐 Executando expiração de agendamentos...")

    await expireAgendamentos()

    res.json({
      success: true,
      message: "Expiração de agendamentos executada com sucesso",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Erro ao executar expiração:", error)
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    })
  }
})

module.exports = router

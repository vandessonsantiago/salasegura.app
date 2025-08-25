import { Request, Response, NextFunction } from "express"
const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const compression = require("compression")
const rateLimit = require("express-rate-limit")
const dotenv = require("dotenv")

// Importar rotas
const userRoutes = require("./routes/user")
const authRoutes = require("./routes/auth")
const processRoutes = require("./routes/processes")
const roomRoutes = require("./routes/rooms")
const conversionRoutes = require("./routes/conversions")
const chatRoutes = require("./routes/chat")
const dashboardChatRoutes = require("./routes/dashboard-chat")
const chatSessionsRoutes = require("./routes/chat-sessions")
const checklistRoutes = require("./routes/checklist")
const checkoutRoutes = require("./routes/checkout")
const paymentStatusRoutes = require("./routes/payment-status")
const webhookRoutes = require("./routes/webhook")
const agendamentosRoutes = require("./routes/agendamentos")
const availableSlotsRoutes = require("./routes/available-slots")
const expireAgendamentosRoutes = require("./routes/expire-agendamentos")

// Importar rota SSE para real-time payment updates
const { router: paymentStreamRouter } = require("./routes/payment-stream")

// Carregar variáveis de ambiente
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3002

// Middleware de segurança
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
)
app.use(compression())
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3001",
      "https://app-salasegura.vandessonsantiago.com",
      "https://admin-salasegura.vandessonsantiago.com",
      "https://salasegura.vandessonsantiago.com",
      "http://localhost:3000",
      "http://localhost:3001",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Cache-Control",
      "Accept",
      "Accept-Encoding",
      "Connection",
    ],
    optionsSuccessStatus: 200,
  })
)

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "development" ? 1000 : 100,
})
app.use(limiter)

// Parser para JSON
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Handle preflight requests
app.options("*", cors())

// Middleware específico para SSE (Server-Sent Events)
app.use(
  "/api/v1/payment-status/*/stream",
  (req: Request, res: Response, next: NextFunction) => {
    // Headers específicos para SSE
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Headers", "Cache-Control")
    res.setHeader("Cache-Control", "no-cache")
    next()
  }
)

// Rota raiz
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Sala Segura API v1",
    version: "1.0.0",
    status: "running",
  })
})

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "Sala Segura API",
  })
})

// Debug endpoint para conexões SSE ativas
app.get("/api/debug/sse-connections", (req: Request, res: Response) => {
  try {
    const { getActiveConnectionsDebug } = require("./routes/payment-stream")
    res.json({
      activeConnections: getActiveConnectionsDebug(),
      timestamp: new Date().toISOString(),
      totalConnections: Object.values(getActiveConnectionsDebug()).reduce(
        (sum: number, count: number) => sum + count,
        0
      ),
    })
  } catch (error) {
    res.status(500).json({
      error: "Failed to get debug info",
      message: error.message,
    })
  }
})

// Rotas da API
app.use("/api/v1/user", userRoutes)
app.use("/api/v1/auth", authRoutes)
app.use("/api/v1/processes", processRoutes)
app.use("/api/v1/rooms", roomRoutes)
app.use("/api/v1/conversions", conversionRoutes)
app.use("/api/v1/chat", chatRoutes)
app.use("/api/v1/dashboard-chat", dashboardChatRoutes)
app.use("/api/v1/chat-sessions", chatSessionsRoutes)
app.use("/api/v1/checklist", checklistRoutes)
app.use("/api/v1/checkout", checkoutRoutes)
// Rota SSE para real-time payment updates (deve vir ANTES da rota geral)
app.use("/api/v1/payment-status", paymentStreamRouter)
app.use("/api/v1/payment-status", paymentStatusRoutes)
app.use("/api/v1/webhook", webhookRoutes)
app.use("/api/v1/agendamentos", agendamentosRoutes)
app.use("/api/v1/available-slots", availableSlotsRoutes)
app.use("/api/v1/expire-agendamentos", expireAgendamentosRoutes)

// Middleware de erro
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Erro:", err)
  res.status(500).json({ error: "Internal server error" })
})

// Rota 404
app.use("*", (req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Sala Segura API rodando na porta ${PORT}`)
  console.log(`📍 Health check: http://localhost:${PORT}/health`)
  console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`)
  console.log("")
  console.log("📡 Endpoints Real-time:")
  console.log(
    `   SSE Stream: http://localhost:${PORT}/api/v1/payment-status/:paymentId/stream`
  )
  console.log(
    `   Debug SSE:  http://localhost:${PORT}/api/debug/sse-connections`
  )
  console.log("")
  console.log("🔗 Endpoints Principais:")
  console.log(`   Webhook:    http://localhost:${PORT}/api/v1/webhook`)
  console.log(`   Checkout:   http://localhost:${PORT}/api/v1/checkout`)
  console.log(`   Agendamentos: http://localhost:${PORT}/api/v1/agendamentos`)
  console.log("")
  console.log("✅ Sistema de pagamento em tempo real ATIVO!")
})

module.exports = app

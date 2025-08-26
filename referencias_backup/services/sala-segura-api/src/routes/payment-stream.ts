// Real-time payment status endpoint usando Server-Sent Events - TypeScript + CommonJS
const express = require("express")
const { supabase } = require("../config/supabase")
// Make this file a module for TypeScript
export {}

const router = express.Router()

// Map para manter conexões ativas
const activeConnections = new Map<string, any[]>()

/**
 * OPTIONS para CORS preflight
 */
router.options("/:paymentId/stream", (req: any, res: any) => {
  res.writeHead(200, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Cache-Control, Accept, Content-Type",
    "Access-Control-Max-Age": "86400", // 24 hours
  })
  res.end()
})

/**
 * Endpoint SSE para real-time payment updates
 * GET /api/v1/payment-status/:paymentId/stream
 */
router.get("/:paymentId/stream", async (req: any, res: any) => {
  const { paymentId } = req.params

  console.log(`🔌 Nova conexão SSE para pagamento ${paymentId}`)

  // Configurar headers SSE
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Cache-Control, Accept, Content-Type",
    "Access-Control-Expose-Headers": "Content-Type, Cache-Control",
  })

  // Função para enviar dados
  const sendEvent = (data: any, event = "payment-update") => {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
    res.write(message)
  }

  // Buscar status atual e enviar imediatamente
  try {
    const { data: payment, error } = await supabase
      .from("agendamentos")
      .select("payment_status, payment_id, status")
      .eq("payment_id", paymentId)
      .maybeSingle() // Usar maybeSingle() em vez de single() para evitar erro quando não encontrar

    if (error) {
      console.error(`❌ Erro ao buscar pagamento ${paymentId}:`, error)
      sendEvent({ error: "Database error", details: error.message }, "error")
      res.end()
      return
    }

    if (!payment) {
      console.log(
        `⚠️ Pagamento ${paymentId} não encontrado no banco, mantendo conexão para aguardar criação`
      )
      // Enviar status inicial como PENDING e manter conexão ativa
      sendEvent({
        id: paymentId,
        status: "PENDING",
        message: "Aguardando criação do pagamento",
        timestamp: new Date().toISOString(),
      })
    } else {
      // Enviar status atual
      sendEvent({
        id: paymentId,
        status: payment.payment_status || payment.status,
        timestamp: new Date().toISOString(),
      })

      // Se já está confirmado, fechar conexão
      if (
        payment.payment_status === "CONFIRMED" ||
        payment.payment_status === "RECEIVED" ||
        payment.status === "CONFIRMED" ||
        payment.status === "RECEIVED"
      ) {
        console.log(`✅ Pagamento ${paymentId} já confirmado, fechando SSE`)
        res.end()
        return
      }
    }
  } catch (error) {
    console.error(`❌ Erro SSE para ${paymentId}:`, error)
    sendEvent({ error: "Internal error", details: error.message }, "error")
    res.end()
    return
  }

  // Adicionar conexão ao map
  if (!activeConnections.has(paymentId)) {
    activeConnections.set(paymentId, [])
  }
  activeConnections.get(paymentId)!.push(res)

  // Timeout de 5 minutos
  const timeout = setTimeout(() => {
    console.log(`⏰ Timeout SSE para pagamento ${paymentId}`)
    sendEvent({ timeout: true }, "timeout")
    removeConnection(paymentId, res)
    res.end()
  }, 300000) // 5 minutos

  // Heartbeat a cada 30 segundos
  const heartbeat = setInterval(() => {
    try {
      sendEvent({ heartbeat: true }, "heartbeat")
    } catch (error) {
      console.error("❌ Erro no heartbeat:", error)
      clearInterval(heartbeat)
    }
  }, 30000)

  // Cleanup quando cliente desconectar
  req.on("close", () => {
    console.log(`🔌 Cliente desconectou SSE para pagamento ${paymentId}`)
    clearTimeout(timeout)
    clearInterval(heartbeat)
    removeConnection(paymentId, res)
  })

  req.on("error", (error: any) => {
    console.error(`❌ Erro na conexão SSE:`, error)
    clearTimeout(timeout)
    clearInterval(heartbeat)
    removeConnection(paymentId, res)
  })

  // Função helper para remover conexão
  function removeConnection(paymentId: string, response: any) {
    const connections = activeConnections.get(paymentId)
    if (connections) {
      const index = connections.indexOf(response)
      if (index > -1) {
        connections.splice(index, 1)
      }
      if (connections.length === 0) {
        activeConnections.delete(paymentId)
      }
    }
  }
})

/**
 * Função para notificar todas as conexões ativas sobre mudança de status
 * Deve ser chamada pelo webhook do Asaas
 */
function notifyPaymentStatusChange(paymentId: string, newStatus: string) {
  console.log(`📢 Notificando mudança de status: ${paymentId} -> ${newStatus}`)

  const connections = activeConnections.get(paymentId)
  if (!connections || connections.length === 0) {
    console.log(`📭 Nenhuma conexão ativa para ${paymentId}`)
    return
  }

  const eventData = {
    id: paymentId,
    status: newStatus,
    timestamp: new Date().toISOString(),
  }

  // Enviar para todas as conexões ativas
  connections.forEach((res, index) => {
    try {
      const message = `event: payment-update\ndata: ${JSON.stringify(eventData)}\n\n`
      res.write(message)
      console.log(`📨 Status enviado para conexão ${index + 1}`)
    } catch (error) {
      console.error(`❌ Erro ao enviar para conexão ${index + 1}:`, error)
      // Remover conexão com erro
      connections.splice(index, 1)
    }
  })

  // Se pagamento foi confirmado, fechar todas as conexões
  if (newStatus === "CONFIRMED" || newStatus === "RECEIVED") {
    console.log(
      `✅ Pagamento confirmado, fechando ${connections.length} conexões`
    )
    connections.forEach((res) => {
      try {
        res.end()
      } catch (error) {
        console.error("❌ Erro ao fechar conexão:", error)
      }
    })
    activeConnections.delete(paymentId)
  }
}

/**
 * Função para debug - ver conexões ativas
 */
function getActiveConnectionsDebug() {
  const debug: Record<string, number> = {}
  for (const [paymentId, connections] of activeConnections.entries()) {
    debug[paymentId] = connections.length
  }
  return debug
}

module.exports = {
  router,
  notifyPaymentStatusChange,
  getActiveConnectionsDebug,
}

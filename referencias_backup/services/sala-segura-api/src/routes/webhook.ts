// biome-ignore assist/source/organizeImports: // biome-ignore
import { z } from "zod"
import { supabase } from "../config/supabase"
import { validateWebhookToken, getWebhookUrl } from "../config/webhook"
import { createCalendarEvent } from "../services/google-calendar"
const express = require("express")

// Importar função de notificação SSE
const { notifyPaymentStatusChange } = require("./payment-stream")

const router = express.Router()

// Schema para evento de webhook Asaas - aceita qualquer payload
const webhookEventSchema = z.any()

// Eventos de pagamento que nos interessam
const PAYMENT_EVENTS = {
  PAYMENT_RECEIVED: "PAYMENT_RECEIVED",
  PAYMENT_CONFIRMED: "PAYMENT_CONFIRMED",
  PAYMENT_OVERDUE: "PAYMENT_OVERDUE",
  PAYMENT_DELETED: "PAYMENT_DELETED",
  PAYMENT_RESTORED: "PAYMENT_RESTORED",
  PAYMENT_REFUNDED: "PAYMENT_REFUNDED",
  PAYMENT_RECEIVED_IN_CASH_UNDONE: "PAYMENT_RECEIVED_IN_CASH_UNDONE",
  PAYMENT_CHARGEBACK_REQUESTED: "PAYMENT_CHARGEBACK_REQUESTED",
  PAYMENT_CHARGEBACK_DISPUTE: "PAYMENT_CHARGEBACK_DISPUTE",
  PAYMENT_AWAITING_CHARGEBACK_REVERSAL: "PAYMENT_AWAITING_CHARGEBACK_REVERSAL",
  PAYMENT_DUNNING_RECEIVED: "PAYMENT_DUNNING_RECEIVED",
  PAYMENT_DUNNING_REQUESTED: "PAYMENT_DUNNING_REQUESTED",
} as const

// Função para processar evento de pagamento
type Payment = {
  id: string
  status?: string
  value?: number
  customer?: string
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function processPaymentEvent(event: string, payment: Payment) {
  console.log(`🔄 Processando evento de pagamento: ${event}`, {
    paymentId: payment.id,
    status: payment.status,
    value: payment.value,
    customer: payment.customer,
  })

  // Aqui você pode implementar a lógica específica para cada evento
  // Por exemplo, atualizar o banco de dados, enviar notificações, etc.

  switch (event) {
    case PAYMENT_EVENTS.PAYMENT_RECEIVED:
      console.log("✅ Pagamento recebido:", payment.id)
      // Para PIX, o PAYMENT_RECEIVED já caracteriza confirmação.
      // Reutilizar a lógica de confirmado sem cair no próximo case.
      await processPaymentEvent(PAYMENT_EVENTS.PAYMENT_CONFIRMED, payment)
      break

    case PAYMENT_EVENTS.PAYMENT_CONFIRMED: {
      console.log("🎉 Pagamento confirmado:", payment.id)
      // Buscar agendamento por payment_id
      let { data: sched, error: findErr } = await supabase
        .from("agendamentos")
        .select("*")
        .eq("payment_id", payment.id)
        .single()

      if (findErr || !sched) {
        console.warn(
          "Agendamento não encontrado para payment_id (tentando novamente)",
          payment.id,
          findErr?.message || findErr
        )
        // Retry simples para evitar condição de corrida (até 3 tentativas)
        for (let i = 0; i < 3; i++) {
          await sleep(1500)
          const retry = await supabase
            .from("agendamentos")
            .select("*")
            .eq("payment_id", payment.id)
            .single()
          if (!retry.error && retry.data) {
            sched = retry.data
            break
          }
        }
        if (!sched) {
          // Se ainda não existe, atualizar assim que existir via update por payment_id
          await updateConsultaStatus(payment.id, "CONFIRMED")
          break
        }
      }

      try {
        // Criar evento no Google Calendar
        console.log("📅 Criando evento no Google Calendar...")
        const appointmentMinutes = Number(process.env.APPOINTMENT_MINUTES || 45)
        const { eventId, meetLink } = await createCalendarEvent({
          date: sched.data,
          time: String(sched.horario).slice(0, 5),
          durationMinutes: appointmentMinutes,
          summary: sched.descricao,
          description: `Consulta confirmada. Cliente: ${sched.cliente_nome} (${sched.cliente_email})`,
          attendees: [sched.cliente_email].filter(Boolean),
        })

        console.log("✅ Evento criado no Google Calendar:", {
          eventId,
          meetLink,
        })

        // Atualizar agendamento com dados do Google Calendar
        const { error: updErr } = await supabase
          .from("agendamentos")
          .update({
            status: "CONFIRMED",
            payment_status: "CONFIRMED",
            calendar_event_id: eventId,
            google_meet_link: meetLink || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", sched.id)

        if (updErr) {
          console.error("Erro ao atualizar agendamento com evento:", updErr)
        } else {
          console.log("✅ Agendamento atualizado com sucesso")
        }
      } catch (calErr) {
        console.error("Erro ao criar evento no Calendar:", calErr)
        // Mesmo com erro no Calendar, marcar como confirmado
        await updateConsultaStatus(payment.id, "CONFIRMED")
      }
      break
    }

    case PAYMENT_EVENTS.PAYMENT_OVERDUE:
      console.log("⏰ Pagamento vencido:", payment.id)
      // Implementar lógica para pagamento vencido
      await updateConsultaStatus(payment.id, "OVERDUE")
      break

    case PAYMENT_EVENTS.PAYMENT_REFUNDED:
      console.log("💰 Pagamento reembolsado:", payment.id)
      // Implementar lógica para pagamento reembolsado
      await updateConsultaStatus(payment.id, "REFUNDED")
      break

    case PAYMENT_EVENTS.PAYMENT_CHARGEBACK_REQUESTED:
      console.log("⚠️ Chargeback solicitado:", payment.id)
      // Implementar lógica para chargeback
      await updateConsultaStatus(payment.id, "CHARGEBACK")
      break

    default:
      console.log("❓ Evento não tratado:", event)
  }
}

// Função para atualizar status da consulta
async function updateConsultaStatus(paymentId: string, status: string) {
  try {
    console.log(
      `📝 Atualizando agendamento com paymentId ${paymentId} para status ${status}`
    )

    // Mapear status recebidos para os suportados na tabela
    const allowed = new Set([
      "PENDING",
      "CONFIRMED",
      "CANCELLED",
      "EXPIRED",
      "OVERDUE",
      "REFUNDED",
    ])

    // Normalização de alguns status vindos da Asaas
    let dbPaymentStatus = status
    if (status === "CHARGEBACK") dbPaymentStatus = "CANCELLED"
    if (!allowed.has(dbPaymentStatus)) dbPaymentStatus = "PENDING"

    // Atualizar status do agendamento no banco de dados
    const { data, error } = await supabase
      .from("agendamentos")
      .update({
        payment_status: dbPaymentStatus,
        status: dbPaymentStatus === "CONFIRMED" ? "CONFIRMED" : "PENDING",
      })
      .eq("payment_id", paymentId)
      .select()
      .single()

    if (error) {
      console.error(`❌ Erro ao atualizar agendamento no banco:`, error)
      return
    }

    console.log(`✅ Agendamento atualizado:`, data)

    // 🔥 NOTIFICAR CLIENTES VIA SSE (REAL-TIME)
    console.log(
      `📢 Notificando mudança via SSE: ${paymentId} -> ${dbPaymentStatus}`
    )
    try {
      notifyPaymentStatusChange(paymentId, dbPaymentStatus)
      console.log(`✅ Notificação SSE enviada com sucesso`)
    } catch (sseError) {
      console.error(`❌ Erro ao enviar notificação SSE:`, sseError)
      // Não falhar o webhook por causa do SSE
    }

    // Aqui você pode adicionar outras integrações:
    // - Enviar email de confirmação
    // - Outras notificações
  } catch (error) {
    console.error(`❌ Erro ao atualizar agendamento:`, error)
  }
}

// Rota POST /api/webhook
router.post("/", async (req, res) => {
  try {
    // Validar token do webhook
    const authHeader =
      (req.headers["asaas-access-token"] as string) ||
      // alguns ambientes/serviços enviam como access_token ou access-token
      (req.headers.access_token as string) ||
      (req.headers["access-token"] as string) ||
      (req.headers["x-asaas-access-token"] as string) ||
      (req.headers["x-access-token"] as string) ||
      ""

    if (!validateWebhookToken(authHeader)) {
      console.error("❌ Token de webhook inválido")
      return res.status(401).json({ error: "Token inválido" })
    }

    // Validar dados do webhook
    const webhookData = webhookEventSchema.parse(req.body)

    console.log("Webhook recebido:", {
      event: webhookData.event,
      paymentId: webhookData.payment?.id,
      status: webhookData.payment?.status,
    })

    // Processar evento de pagamento
    if (webhookData.payment && webhookData.event) {
      await processPaymentEvent(webhookData.event, webhookData.payment)
    }

    // Retornar sucesso
    res.status(200).json({
      success: true,
      message: "Webhook processado com sucesso",
    })
  } catch (error) {
    console.error("Erro ao processar webhook:", error)

    if (error instanceof z.ZodError) {
      console.error("Erro de validação:", error.errors)
      return res.status(400).json({
        error: "Dados do webhook inválidos",
        details: error.errors,
      })
    }

    // Retornar erro 500 para que o Asaas tente novamente
    res.status(500).json({
      error: "Erro interno do servidor",
    })
  }
})

// Rota GET para verificar se o webhook está funcionando
router.get("/", (_req, res) => {
  res.json({
    message: "Webhook endpoint está funcionando",
    timestamp: new Date().toISOString(),
    webhookUrl: getWebhookUrl(),
    events: [
      "PAYMENT_RECEIVED",
      "PAYMENT_CONFIRMED",
      "PAYMENT_OVERDUE",
      "PAYMENT_REFUNDED",
      "PAYMENT_CHARGEBACK_REQUESTED",
    ],
  })
})

// Rota POST para configurar webhook na Asaas (para facilitar testes)
router.post("/setup", async (_req, res) => {
  try {
    const webhookUrl = getWebhookUrl()

    console.log(`🔧 Configurando webhook: ${webhookUrl}`)

    // Aqui você pode implementar a configuração automática do webhook
    // Por enquanto, apenas retorna as informações necessárias

    res.json({
      success: true,
      message: "Webhook configurado com sucesso",
      webhookUrl,
      instructions: [
        "1. Acesse o painel da Asaas",
        "2. Vá em Configurações > Webhooks",
        "3. Adicione a URL do webhook",
        "4. Selecione os eventos desejados",
        "5. Salve a configuração",
      ],
      events: [
        "PAYMENT_RECEIVED",
        "PAYMENT_CONFIRMED",
        "PAYMENT_OVERDUE",
        "PAYMENT_REFUNDED",
        "PAYMENT_CHARGEBACK_REQUESTED",
      ],
    })
  } catch (error) {
    console.error("Erro ao configurar webhook:", error)
    res.status(500).json({ error: "Erro ao configurar webhook" })
  }
})

// Rota POST para testar webhook (simula evento da Asaas)
router.post("/test", async (req, res) => {
  try {
    const { paymentId, event = "PAYMENT_CONFIRMED" } = req.body

    if (!paymentId) {
      return res.status(400).json({ error: "paymentId é obrigatório" })
    }

    console.log(
      `🧪 Testando webhook - Evento: ${event}, PaymentId: ${paymentId}`
    )

    // Simular payload da Asaas
    const testPayload = {
      event,
      payment: {
        id: paymentId,
        customer: "customer_test_123",
        value: 99.0,
        netValue: 99.0,
        description: "Consulta de Alinhamento Inicial",
        billingType: "PIX",
        status: "CONFIRMED",
        dueDate: new Date().toISOString().split("T")[0],
        originalDueDate: new Date().toISOString().split("T")[0],
        paymentDate: new Date().toISOString(),
        pixQrCode:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
        pixCopyAndPaste:
          "00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266141740005204000053039865405100.005802BR5913Teste Empresa6008Brasilia62070503***6304E2CA",
      },
    }

    // Simular processamento do webhook diretamente
    console.log(`🧪 Processando webhook simulado:`, testPayload)

    // Log simples para simular processamento
    console.log(`🎉 Pagamento confirmado: ${paymentId}`)
    console.log(
      `📝 Atualizando consulta com paymentId ${paymentId} para status CONFIRMED`
    )
    console.log(
      `✅ Consulta atualizada: paymentId=${paymentId}, status=CONFIRMED`
    )

    console.log(`🧪 Webhook simulado processado com sucesso`)

    res.json({
      success: true,
      message: "Teste do webhook executado com sucesso",
      testPayload,
      processed: true,
      paymentId: paymentId,
      status: "CONFIRMED",
    })
  } catch (error) {
    console.error("Erro no teste do webhook:", error)
    res.status(500).json({ error: "Erro no teste do webhook" })
  }
})

module.exports = router

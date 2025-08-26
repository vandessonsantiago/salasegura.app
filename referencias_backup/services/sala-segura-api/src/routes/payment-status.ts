const express = require("express")
const axios = require("axios")
const { z } = require("zod")

const router = express.Router()

// Configuração Asaas
const ASAAS_CONFIG = {
  BASE_URL:
    process.env.NODE_ENV === "production"
      ? "https://api.asaas.com/v3"
      : "https://api-sandbox.asaas.com/v3",
  API_KEY: process.env.ASAAS_API_KEY || "",
}

// Cliente Axios configurado para Asaas
const asaasClient = axios.create({
  baseURL: ASAAS_CONFIG.BASE_URL,
  headers: {
    access_token: ASAAS_CONFIG.API_KEY,
    "Content-Type": "application/json",
  },
})

// Schema para resposta de pagamento Asaas
const asaasPaymentSchema = z.object({
  id: z.string(),
  customer: z.string(),
  subscription: z.string().nullable().optional(),
  installment: z.string().nullable().optional(),
  installmentNumber: z.number().nullable().optional(),
  installmentDescription: z.string().nullable().optional(),
  paymentLink: z.string().nullable().optional(),
  value: z.number(),
  netValue: z.number(),
  originalValue: z.number().nullable().optional(),
  interestValue: z.number().nullable().optional(),
  description: z.string(),
  billingType: z.string(),
  status: z.string(),
  dueDate: z.string(),
  originalDueDate: z.string(),
  paymentDate: z.string().nullable().optional(),
  clientPaymentDate: z.string().nullable().optional(),
  invoiceUrl: z.string().nullable().optional(),
  bankSlipUrl: z.string().nullable().optional(),
  transactionReceiptUrl: z.string().nullable().optional(),
  discount: z
    .object({
      value: z.number(),
      dueDateLimitDays: z.number(),
      type: z.string(),
    })
    .nullable()
    .optional(),
  fine: z
    .object({
      value: z.number(),
    })
    .nullable()
    .optional(),
  interest: z
    .object({
      value: z.number(),
    })
    .nullable()
    .optional(),
  postalService: z.boolean().nullable().optional(),
  pixQrCode: z.string().nullable().optional(),
  pixCopyAndPaste: z.string().nullable().optional(),
  refunded: z.boolean().nullable().optional(),
  refundedValue: z.number().nullable().optional(),
  refundedDate: z.string().nullable().optional(),
  chargeback: z
    .object({
      status: z.string(),
      value: z.number(),
      reason: z.string().optional(),
    })
    .nullable()
    .optional(),
  split: z
    .array(
      z.object({
        walletId: z.string(),
        fixedValue: z.number().optional(),
        percentualValue: z.number().optional(),
        totalFee: z.number().optional(),
        totalFeeAsPercentual: z.number().optional(),
      })
    )
    .nullable()
    .optional(),
})

// Rota GET /api/payment-status/:id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params

    if (!id) {
      return res.status(400).json({ error: "ID do pagamento é obrigatório" })
    }

    console.log(`🔍 Verificando status do pagamento: ${id}`)

    // Buscar pagamento na Asaas
    const response = await asaasClient.get(`/payments/${id}`)

    // Validar resposta
    const payment = asaasPaymentSchema.parse(response.data)

    console.log(`✅ Status do pagamento ${id}: ${payment.status}`)

    // Se for PIX e ainda não tem dados do QR Code, buscar
    if (payment.billingType === "PIX" && !payment.pixQrCode) {
      try {
        const pixResponse = await asaasClient.get(`/payments/${id}/pixQrCode`)
        payment.pixQrCode = pixResponse.data.encodedImage
        payment.pixCopyAndPaste = pixResponse.data.payload
        console.log(`📱 Dados PIX obtidos para pagamento ${id}`)
      } catch (pixError) {
        console.log(`⚠️ Erro ao buscar dados PIX: ${pixError}`)
      }
    }

    // Retornar dados do pagamento
    res.json({
      id: payment.id,
      customer: payment.customer,
      value: payment.value,
      netValue: payment.netValue,
      description: payment.description,
      billingType: payment.billingType,
      status: payment.status,
      dueDate: payment.dueDate,
      originalDueDate: payment.originalDueDate,
      paymentDate: payment.paymentDate,
      clientPaymentDate: payment.clientPaymentDate,
      invoiceUrl: payment.invoiceUrl,
      bankSlipUrl: payment.bankSlipUrl,
      transactionReceiptUrl: payment.transactionReceiptUrl,
      pixQrCode: payment.pixQrCode,
      pixCopyAndPaste: payment.pixCopyAndPaste,
      refunded: payment.refunded,
      refundedValue: payment.refundedValue,
      refundedDate: payment.refundedDate,
    })
  } catch (error) {
    console.error("Erro ao verificar status do pagamento:", error)

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        return res.status(404).json({ error: "Pagamento não encontrado" })
      }

      if (error.response?.status === 401) {
        return res.status(401).json({ error: "API key inválida" })
      }
    }

    res.status(500).json({ error: "Erro interno do servidor" })
  }
})

module.exports = router

import express from "express"
import type { Request, Response } from 'express'
import axios from "axios"
import { z } from "zod"

import type { Router } from 'express'
const router: Router = express.Router()

// Configuração Asaas
const ASAAS_CONFIG = {
  BASE_URL: "https://api-sandbox.asaas.com/v3",
  API_KEY: process.env.ASAAS_API_KEY || "",
}

// Schema para validação de pagamento
const paymentRequestSchema = z.object({
  customer: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    cpfCnpj: z.string().min(11).max(18),
    phone: z.string().optional(),
    postalCode: z.string().optional(),
    address: z.string().optional(),
    addressNumber: z.string().optional(),
    complement: z.string().optional(),
    province: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
  }),
  userId: z.string().min(10), // UUID do usuário autenticado
  billingType: z.enum(["PIX", "CREDIT_CARD"]),
  // O Asaas sandbox e regras de negócio exigem valor mínimo de R$5.00
  value: z.number().min(5, { message: "O valor mínimo para cobrança é 5.00" }),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().min(1),
  creditCard: z
    .object({
      holderName: z.string().min(2),
      number: z.string().min(13).max(19),
      expiryMonth: z.string().length(2),
      expiryYear: z.string().length(4),
      ccv: z.string().min(3).max(4),
    })
    .optional(),
  creditCardHolderInfo: z
    .object({
      name: z.string().min(2),
      email: z.string().email(),
      cpfCnpj: z.string().min(11).max(18),
      postalCode: z.string(),
      addressNumber: z.string().min(1),
      phone: z.string(),
    })
    .optional(),
  remoteIp: z.string().optional(),
  agendamentoId: z.string().optional(),
})

// Schema para resposta de cliente Asaas
const asaasCustomerSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string().nullable().optional(),
  mobilePhone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  addressNumber: z.string().nullable().optional(),
  complement: z.string().nullable().optional(),
  province: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  cpfCnpj: z.string().nullable().optional(),
  personType: z.string().nullable().optional(),
  deleted: z.boolean().optional(),
  additionalEmails: z.string().nullable().optional(),
  externalReference: z.string().nullable().optional(),
  notificationDisabled: z.boolean().optional(),
  observations: z.string().nullable().optional(),
  city: z.number().nullable().optional(),
  state: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
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

// Cliente Axios configurado para Asaas
const asaasClient = axios.create({
  baseURL: ASAAS_CONFIG.BASE_URL,
  headers: {
    access_token: ASAAS_CONFIG.API_KEY,
    "Content-Type": "application/json",
  },
})

// Log da configuração para debug (apenas em desenvolvimento) e com chave mascarada
if (process.env.NODE_ENV !== "production") {
  const maskedKey = ASAAS_CONFIG.API_KEY
    ? `${ASAAS_CONFIG.API_KEY.slice(0, 8)}...${ASAAS_CONFIG.API_KEY.slice(-4)}`
    : "não definida"
  console.log("🔧 Configuração Asaas:", {
    baseURL: ASAAS_CONFIG.BASE_URL,
    apiKey: maskedKey,
  })
}

// Função para criar ou buscar cliente
async function getOrCreateCustomer(customerData: any): Promise<string> {
  try {
    // Primeiro, tentar buscar cliente por CPF/CNPJ
    if (customerData.cpfCnpj) {
      console.log("🔍 Asaas: buscando cliente por cpfCnpj:", customerData.cpfCnpj)
      const searchResponse = await asaasClient.get("/customers", {
        params: { cpfCnpj: customerData.cpfCnpj },
      })
      console.log("🔁 Asaas: resposta busca customer (raw):", searchResponse?.data)

      if (searchResponse.data.data && searchResponse.data.data.length > 0) {
        const existingCustomer = asaasCustomerSchema.parse(
          searchResponse.data.data[0]
        )
        console.log("✅ Asaas: cliente existente encontrado id=", existingCustomer.id)
        return existingCustomer.id
      }
    }

    // Se não encontrou, criar novo cliente
    const createPayload = {
      name: customerData.name,
      email: customerData.email,
      phone: customerData.phone,
      mobilePhone: customerData.phone,
      cpfCnpj: customerData.cpfCnpj,
      postalCode: customerData.postalCode,
      address: customerData.address,
      addressNumber: customerData.addressNumber,
      complement: customerData.complement,
      province: customerData.province,
      city: customerData.city,
      state: customerData.state,
    }
    console.log("🔧 Asaas: criando cliente com payload:", createPayload)
    const createResponse = await asaasClient.post("/customers", createPayload)
    console.log("🔁 Asaas: resposta create customer (raw):", createResponse?.data)

    const newCustomer = asaasCustomerSchema.parse(createResponse.data)
    console.log("✅ Asaas: novo cliente criado id=", newCustomer.id)
    return newCustomer.id
  } catch (error) {
  console.error("Erro ao criar/buscar cliente:", error)

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 400) {
        throw new Error("Dados do cliente inválidos")
      }
      if (error.response?.status === 409) {
        throw new Error("Cliente já existe")
      }
      if (error.response?.status === 401) {
        console.error("❌ Erro de autenticação Asaas:", error.response?.data)
        throw new Error("Erro de autenticação com Asaas. Verifique a API key.")
      }
      // Log do erro real para debug
      console.error("❌ Erro detalhado ao criar cliente:", {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
        message: error.message,
      })
    }

    throw new Error("Falha ao criar cliente")
  }
}

// Função para criar pagamento
async function createPayment(paymentData: any): Promise<any> {
  try {
    const paymentPayload: any = {
      customer: paymentData.customer,
      billingType: paymentData.billingType,
      value: paymentData.value,
      dueDate: paymentData.dueDate,
      description: paymentData.description,
      externalReference: `payment_${Date.now()}`,
    }

    // Adicionar dados específicos do cartão se necessário
    if (paymentData.billingType === "CREDIT_CARD") {
      if (paymentData.creditCard) {
        paymentPayload.creditCard = paymentData.creditCard
      }
      if (paymentData.creditCardHolderInfo) {
        paymentPayload.creditCardHolderInfo = paymentData.creditCardHolderInfo
      }
      if (paymentData.remoteIp) {
        paymentPayload.remoteIp = paymentData.remoteIp
      }
    }

    console.log("✅ FLUXO REAL ASAAS - Criando pagamento...")
  console.log("🔧 Asaas: criando pagamento com payload:", paymentPayload)
  const response = await asaasClient.post("/payments", paymentPayload)
  console.log("🔁 Asaas: resposta create payment (raw):", response?.data)
  const payment = asaasPaymentSchema.parse(response.data)
  console.log("✅ Pagamento criado no Asaas:", payment.id)

    // Se for PIX, buscar dados do QR Code
    if (payment.billingType === "PIX") {
      try {
        console.log("🔍 Buscando QR Code PIX real...")
        const pixResponse = await asaasClient.get(
          `/payments/${payment.id}/pixQrCode`
        )
        console.log("🔁 Asaas: resposta pixQrCode (raw):", pixResponse?.data)
        payment.pixQrCode = pixResponse.data.encodedImage
        payment.pixCopyAndPaste = pixResponse.data.payload
        // Detect placeholder values (very short or fixed placeholders used by sandbox)
        const isPlaceholderPix = !payment.pixCopyAndPaste || payment.pixCopyAndPaste.length < 20
        if (isPlaceholderPix) {
          console.warn("⚠️ PIX copy/paste parece ser placeholder ou vazio:", payment.pixCopyAndPaste)
        }
        console.log("✅ QR Code PIX REAL obtido com sucesso!")
        console.log("📋 Dados PIX:", {
          qrCodeLength: payment.pixQrCode?.length || 0,
          copyPasteLength: payment.pixCopyAndPaste?.length || 0,
          copyPasteStart: payment.pixCopyAndPaste?.substring(0, 20) + "...",
        })
      } catch (pixError) {
        console.log("⚠️ Erro ao buscar dados PIX:", pixError)
      }
    }

    return payment
  } catch (error) {
    console.error("Erro ao criar pagamento:", error)

    if (axios.isAxiosError(error)) {
      const errorData = error.response?.data

      if (error.response?.status === 400) {
        if (errorData?.errors) {
          const errorMessages = errorData.errors
            .map((err: any) => err.description)
            .join(", ")
          throw new Error(errorMessages)
        }
        throw new Error("Dados do pagamento inválidos")
      }

      if (error.response?.status === 401) {
        console.error("❌ Erro de autenticação Asaas:", error.response?.data)
        throw new Error("Erro de autenticação com Asaas. Verifique a API key.")
      }

      if (error.response?.status === 403) {
        throw new Error("Acesso negado")
      }

      if (error.response?.status === 422) {
        if (errorData?.errors) {
          const errorMessages = errorData.errors
            .map((err: any) => err.description)
            .join(", ")
          throw new Error(errorMessages)
        }
        throw new Error("Dados inválidos para processamento")
      }
    }

    throw new Error("Falha no processamento do pagamento")
  }
}

// Rota POST /api/checkout
router.post("/", async (req: Request, res: Response) => {
  try {
    console.log("📥 Request recebido:", JSON.stringify(req.body, null, 2))

  // Validar request body
  const validatedData = paymentRequestSchema.parse(req.body)
  console.log("✅ Dados validados com sucesso. Payload validado:", JSON.stringify(validatedData, null, 2))
  console.log("▶️ Iniciando fluxo de checkout: buscando/creando cliente -> criando pagamento -> opcional PIX QR")

    // Defensive runtime check: garantir valor mínimo (caso venha bypassado)
    if (validatedData.value < 5) {
      return res.status(400).json({ error: "O valor mínimo para cobrança é 5.00" })
    }

    // Obter IP do cliente
    const clientIp =
      req.headers["x-forwarded-for"] ||
      req.headers["x-real-ip"] ||
      req.ip ||
      "127.0.0.1"

    // Criar ou buscar cliente
    const customerId = await getOrCreateCustomer(validatedData.customer)

    // Preparar dados do pagamento
    const paymentData = {
      ...validatedData,
      customer: customerId, // Usar ID do cliente
      remoteIp: clientIp,
    }

    // Criar pagamento
    const payment = await createPayment(paymentData)

    // Inserir registro do pagamento no Supabase
    try {
      const { supabaseAdmin } = require('../lib/supabase');
      const { error } = await supabaseAdmin
        .from('payments')
        .insert({
            asaas_id: payment.id,
            status: payment.status,
            valor: payment.value,
            user_id: validatedData.userId, // UUID do usuário autenticado
            agendamento_id: validatedData.agendamentoId || null
        });
      if (error) {
        console.error('Erro ao inserir pagamento no Supabase:', error);
      } else {
        console.log('Pagamento inserido no Supabase:', payment.id);
      }
    } catch (err) {
      console.error('Erro inesperado ao inserir pagamento no Supabase:', err);
    }

    // Retornar resposta
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
    console.error("Erro no checkout:", error)

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Dados inválidos",
        details: error.errors,
      })
    }

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Falha no processamento do pagamento"

    res.status(400).json({ error: errorMessage })
  }
})

export default router

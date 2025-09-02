import express from "express"
import type { Request, Response } from 'express'
import axios from "axios"
import { z } from "zod"
import { authenticateToken } from '../middleware/auth'
import { CheckoutService } from '../services/CheckoutService'

import type { Router } from 'express'
const router: Router = express.Router()

// Tipo para request autenticado
type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    email: string;
  };
};

// Schema para validação de checkout completo (compatível com frontend)
const checkoutRequestSchema = z.object({
  customer: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    cpfCnpj: z.string().min(11).max(18),
    phone: z.string().min(10), // 🔧 CORREÇÃO: Tornar phone obrigatório com mínimo de 10 caracteres
  }),
  value: z.number().min(5),
  description: z.string().min(1),
  serviceType: z.string().min(1),
  serviceData: z.any().optional(),
  billingType: z.string().optional(),
  dueDate: z.string().optional(),
  userId: z.string().optional(),
  // Campos opcionais para data e horário do agendamento
  data: z.string().optional(),
  horario: z.string().optional(),
  // 🔧 CORREÇÃO: Adicionar campos para dados do calendário
  calendarEventId: z.string().optional(),
  googleMeetLink: z.string().optional(),
})

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

// ROTA TEMPORÁRIA PARA DEBUG - checkout sem autenticação
router.post("/debug", async (req, res) => {
  try {
    console.log("🔍 [DEBUG] Checkout sem autenticação chamado!");
    console.log("📥 Request body:", JSON.stringify(req.body, null, 2));

    // Mesmo código da rota original, mas sem validação de autenticação
    const validatedData = checkoutRequestSchema.parse(req.body);
    console.log("✅ [DEBUG] Dados validados:", JSON.stringify(validatedData, null, 2));

    const checkoutData = {
      cliente: {
        name: validatedData.customer.name,
        email: validatedData.customer.email,
        cpfCnpj: validatedData.customer.cpfCnpj,
        phone: validatedData.customer.phone || "",
      },
      valor: validatedData.value,
      descricao: validatedData.description,
      serviceType: validatedData.serviceType,
      serviceData: validatedData.serviceData || {},
      data: validatedData.data,
      horario: validatedData.horario,
      calendarEventId: validatedData.calendarEventId,
      googleMeetLink: validatedData.googleMeetLink,
    };

    console.log("🚀 [DEBUG] Chamando CheckoutService.processarCheckoutCompleto...");

    // Mock do req.user para simular usuário autenticado
    const mockReq = req as any;
    mockReq.user = { id: 'ac963a9a-57b0-4996-8d2b-1d70faf5564d', email: 'test@example.com' };

    const result = await CheckoutService.processarCheckoutCompleto(mockReq, checkoutData);

    console.log("✅ [DEBUG] Resultado do checkout:", result);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result);
  } catch (error) {
    console.error("❌ [DEBUG] Erro no checkout debug:", error);
    res.status(500).json({ error: "Erro interno", details: (error as any).message });
  }
});

// Rota POST /api/checkout
router.post("/", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log("� [CHECKOUT] Rota autenticada chamada!");
    console.log("�📥 [CHECKOUT] Request body:", JSON.stringify(req.body, null, 2));

    // Validar request body
    const validatedData = checkoutRequestSchema.parse(req.body)
    console.log("✅ Dados validados com sucesso. Payload validado:", JSON.stringify(validatedData, null, 2))

    // Preparar dados para o CheckoutService (mapeando nomes do frontend)
    const checkoutData = {
      cliente: {
        name: validatedData.customer.name,
        email: validatedData.customer.email,
        cpfCnpj: validatedData.customer.cpfCnpj,
        phone: validatedData.customer.phone || "",
      },
      valor: validatedData.value,
      descricao: validatedData.description,
      serviceType: validatedData.serviceType,
      serviceData: validatedData.serviceData || {},
      // Incluir data e horário se fornecidos
      data: validatedData.data,
      horario: validatedData.horario,
      // 🔧 CORREÇÃO: Incluir dados do calendário se fornecidos
      calendarEventId: validatedData.calendarEventId,
      googleMeetLink: validatedData.googleMeetLink,
    }

    console.log("🚀 Iniciando processamento completo do checkout...")

    // Usar o CheckoutService para processar tudo (agendamento + pagamento)
    const result = await CheckoutService.processarCheckoutCompleto(req, checkoutData)

    if (!result.success) {
      console.error("❌ Falha no processamento do checkout:", result.error)
      return res.status(400).json({ error: result.error })
    }

    console.log("✅ Checkout processado com sucesso!")
    console.log("📋 Resultado:", {
      agendamentoId: result.agendamentoId,
      paymentId: result.paymentId,
      hasPix: !!result.qrCodePix
    })

    // Retornar resposta completa
    res.json({
      success: true,
      agendamentoId: result.agendamentoId,
      paymentId: result.paymentId,
      qrCodePix: result.qrCodePix,
      copyPastePix: result.copyPastePix,
      pixExpiresAt: result.pixExpiresAt,
      message: "Checkout processado com sucesso! Agendamento criado e pagamento gerado."
    })

  } catch (error) {
    console.error("❌ Erro no checkout:", error)

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

// Endpoint para verificar status do pagamento
router.get("/status/:paymentId", async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params

    if (!paymentId) {
      return res.status(400).json({ error: "Payment ID é obrigatório" })
    }

    console.log(`🔍 Verificando status do pagamento: ${paymentId}`)

    // Buscar pagamento no Asaas
    const response = await axios.get(
      `${ASAAS_CONFIG.BASE_URL}/payments/${paymentId}`,
      {
        headers: {
          "Content-Type": "application/json",
          "access_token": ASAAS_CONFIG.API_KEY,
        },
      }
    )

    const payment = response.data
    console.log(`✅ Status do pagamento ${paymentId}: ${payment.status}`)

    // Retornar apenas as informações essenciais
    res.json({
      id: payment.id,
      status: payment.status,
      value: payment.value,
      netValue: payment.netValue,
      paymentDate: payment.paymentDate,
      description: payment.description,
    })

  } catch (error) {
    console.error("Erro ao verificar status do pagamento:", error)

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        return res.status(404).json({ error: "Pagamento não encontrado" })
      }
      return res.status(error.response?.status || 500).json({
        error: "Erro na API do Asaas",
        details: error.response?.data
      })
    }

    res.status(500).json({ error: "Erro interno do servidor" })
  }
})

export default router

import { PAYMENT_STATUS, PRICING } from "./checkout-constants"

export interface PaymentStatusResponse {
  status: string
  statusDetail?: string
  transactionAmount?: number
  dateApproved?: string
  dateCreated?: string
  externalReference?: string
  paymentId: string
}

export interface CheckoutPreference {
  items: Array<{
    title: string
    description?: string
    quantity: number
    currency_id: string
    unit_price: number
  }>
  payer?: {
    email?: string
    name?: string
    surname?: string
    phone?: {
      area_code: string
      number: string
    }
  }
  back_urls?: {
    success: string
    failure: string
    pending: string
  }
  auto_return?: "approved" | "all"
  external_reference?: string
  statement_descriptor?: string
  notification_url?: string
}

/**
 * Formata valor monetário para exibição
 */
export function formatCurrency(value: number, currency: string = "BRL"): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(value)
}

/**
 * Valida se o status do pagamento é final (não mudará mais)
 */
export function isPaymentStatusFinal(status: string): boolean {
  return [
    PAYMENT_STATUS.APPROVED,
    PAYMENT_STATUS.REJECTED,
    PAYMENT_STATUS.CANCELLED,
    PAYMENT_STATUS.CHARGED_BACK,
  ].includes(status as any)
}

/**
 * Converte status do pagamento para texto amigável
 */
export function getPaymentStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    [PAYMENT_STATUS.PENDING]: "Pendente",
    [PAYMENT_STATUS.APPROVED]: "Aprovado",
    [PAYMENT_STATUS.REJECTED]: "Rejeitado",
    [PAYMENT_STATUS.CANCELLED]: "Cancelado",
    [PAYMENT_STATUS.FAILED]: "Falhou",
    [PAYMENT_STATUS.IN_PROCESS]: "Processando",
    [PAYMENT_STATUS.IN_MEDIATION]: "Em mediação",
    [PAYMENT_STATUS.CHARGED_BACK]: "Estornado",
  }
  
  return statusMap[status] || status
}

/**
 * Converte tipo de serviço para configuração de preço
 */
export function getServicePricing(tipo: "sessao" | "mensalidade") {
  switch (tipo) {
    case "sessao":
      return PRICING.SESSAO_INDIVIDUAL
    case "mensalidade":
      return PRICING.MENSALIDADE_BASICA
    default:
      return PRICING.SESSAO_INDIVIDUAL
  }
}

/**
 * Cria preferência de checkout para Mercado Pago
 */
export function createCheckoutPreference(
  tipo: "sessao" | "mensalidade",
  agendamentoId?: string,
  userEmail?: string
): CheckoutPreference {
  const pricing = getServicePricing(tipo)
  
  const preference: CheckoutPreference = {
    items: [
      {
        title: pricing.description,
        quantity: 1,
        currency_id: pricing.currency,
        unit_price: pricing.value,
      },
    ],
    external_reference: agendamentoId || `${tipo}_${Date.now()}`,
    statement_descriptor: "SALA SEGURA",
  }

  if (userEmail) {
    preference.payer = {
      email: userEmail,
    }
  }

  return preference
}

/**
 * Gera QR Code data para PIX
 */
export function generatePixQRData(
  value: number,
  description: string,
  txId?: string
): string {
  // Implementação simplificada - em produção use a API do seu PSP
  const pixData = {
    version: "01",
    pointOfInitiation: "11",
    merchantAccountInformation: {
      gui: "br.gov.bcb.pix",
      key: process.env.NEXT_PUBLIC_PIX_KEY || "",
    },
    merchantCategoryCode: "0000",
    transactionCurrency: "986", // BRL
    transactionAmount: value.toFixed(2),
    countryCode: "BR",
    merchantName: "SALA SEGURA",
    merchantCity: "SAO PAULO",
    additionalDataFieldTemplate: {
      billNumber: txId || "",
    },
  }
  
  // Em produção, use uma biblioteca adequada para gerar PIX QR Code
  return JSON.stringify(pixData)
}

/**
 * Valida se o email é válido
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Valida se o telefone é válido (formato brasileiro)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\(?([0-9]{2})\)?[-.\s]?([0-9]{4,5})[-.\s]?([0-9]{4})$/
  return phoneRegex.test(phone.replace(/\D/g, ""))
}

/**
 * Formata CPF/CNPJ
 */
export function formatDocument(document: string): string {
  const numbers = document.replace(/\D/g, "")
  
  if (numbers.length === 11) {
    // CPF
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  } else if (numbers.length === 14) {
    // CNPJ
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
  }
  
  return document
}

/**
 * Calcula timeout para polling baseado no método de pagamento
 */
export function getPaymentTimeout(paymentMethod: string): number {
  const timeouts: Record<string, number> = {
    pix: 5 * 60 * 1000, // 5 minutos para PIX
    credit_card: 2 * 60 * 1000, // 2 minutos para cartão
    ticket: 24 * 60 * 60 * 1000, // 24 horas para boleto
  }
  
  return timeouts[paymentMethod] || 10 * 60 * 1000 // 10 minutos default
}

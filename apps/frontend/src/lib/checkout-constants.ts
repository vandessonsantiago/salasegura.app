export const PAYMENT_METHODS = {
  PIX: "pix",
  CREDIT_CARD: "credit_card",
  DEBIT_CARD: "debit_card",
  BOLETO: "ticket",
} as const

export const STATES = {
  IDLE: "idle",
  LOADING: "loading",
  PROCESSING: "processing",
  SUCCESS: "success",
  ERROR: "error",
  CANCELLED: "cancelled",
} as const

export const PAYMENT_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
  FAILED: "failed",
  IN_PROCESS: "in_process",
  IN_MEDIATION: "in_mediation",
  CHARGED_BACK: "charged_back",
} as const

export const CHECKOUT_CONFIG = {
  MERCADO_PAGO: {
    PUBLIC_KEY: process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY,
    SUCCESS_URL: process.env.NEXT_PUBLIC_APP_URL + "/checkout/success",
    FAILURE_URL: process.env.NEXT_PUBLIC_APP_URL + "/checkout/failure",
    PENDING_URL: process.env.NEXT_PUBLIC_APP_URL + "/checkout/pending",
  },
  TIMEOUT: 30000, // 30 segundos
  POLLING_INTERVAL: 2000, // 2 segundos
} as const

export const PRICING = {
  SESSAO_INDIVIDUAL: {
    value: 150.00,
    description: "Sessão Individual de Terapia",
    currency: "BRL",
  },
  MENSALIDADE_BASICA: {
    value: 500.00,
    description: "Plano Mensal - 4 Sessões",
    currency: "BRL",
  },
  MENSALIDADE_PREMIUM: {
    value: 800.00,
    description: "Plano Premium - 6 Sessões + Material",
    currency: "BRL",
  },
} as const

export type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS]
export type PaymentState = typeof STATES[keyof typeof STATES]
export type PaymentStatusType = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS]

// Configuração do Webhook Asaas
export const WEBHOOK_CONFIG = {
  // URL do webhook (será configurada no painel da Asaas)
  URL:
    process.env.WEBHOOK_URL ||
    "https://api-salasegura.vandessonsantiago.com/api/v1/webhook",

  // Token de segurança (opcional, mas recomendado)
  TOKEN: process.env.ASAAS_WEBHOOK_TOKEN || "",

  // Eventos que queremos receber
  EVENTS: [
    "PAYMENT_RECEIVED",
    "PAYMENT_CONFIRMED",
    "PAYMENT_OVERDUE",
    "PAYMENT_REFUNDED",
    "PAYMENT_CHARGEBACK_REQUESTED",
  ],

  // Configurações de retry
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 5000, // 5 segundos
}

// Função para gerar URL do webhook
export function getWebhookUrl() {
  const explicitBase =
    process.env.WEBHOOK_BASE_URL ||
    process.env.API_BASE_URL ||
    process.env.API_URL ||
    undefined

  const vercelUrl = process.env.VERCEL_URL // geralmente só o host em Vercel

  let baseUrl: string
  if (process.env.NODE_ENV === "production") {
    baseUrl =
      explicitBase?.trim() ||
      (vercelUrl ? `https://${vercelUrl}` : "") ||
      "https://api-salasegura.vandessonsantiago.com"
  } else {
    baseUrl = explicitBase?.trim() || "http://localhost:3002"
  }

  // garantir sem barra final antes de anexar o path
  baseUrl = baseUrl.replace(/\/$/, "")
  return `${baseUrl}/api/v1/webhook`
}

// Função para validar token do webhook
export function validateWebhookToken(token: string): boolean {
  if (!WEBHOOK_CONFIG.TOKEN) {
    // Se não há token configurado, aceitar qualquer token
    return true
  }

  return token === WEBHOOK_CONFIG.TOKEN
}

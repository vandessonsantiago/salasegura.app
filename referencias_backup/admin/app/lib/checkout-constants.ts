// Constantes para o sistema de checkout Asaas

export const ASAAS_CONFIG = {
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://api.asaas.com/v3'
    : 'https://api-sandbox.asaas.com/v3',
  API_KEY: process.env.ASAAS_API_KEY || '',
  WEBHOOK_TOKEN: process.env.ASAAS_WEBHOOK_TOKEN || '',
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  RECEIVED: 'RECEIVED',
  CONFIRMED: 'CONFIRMED',
  OVERDUE: 'OVERDUE',
  REFUNDED: 'REFUNDED',
  RECEIVED_IN_CASH: 'RECEIVED_IN_CASH',
  REFUND_REQUESTED: 'REFUND_REQUESTED',
  CHARGEBACK_REQUESTED: 'CHARGEBACK_REQUESTED',
  CHARGEBACK_DISPUTE: 'CHARGEBACK_DISPUTE',
  AWAITING_CHARGEBACK_REVERSAL: 'AWAITING_CHARGEBACK_REVERSAL',
  DUNNING_REQUESTED: 'DUNNING_REQUESTED',
  DUNNING_RECEIVED: 'DUNNING_RECEIVED',
  AWAITING_RISK_ANALYSIS: 'AWAITING_RISK_ANALYSIS',
} as const;

export const PAYMENT_METHODS = {
  PIX: 'PIX',
  CREDIT_CARD: 'CREDIT_CARD',
  BOLETO: 'BOLETO',
  BANK_SLIP: 'BANK_SLIP',
} as const;

export const WEBHOOK_EVENTS = {
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
  PAYMENT_CONFIRMED: 'PAYMENT_CONFIRMED',
  PAYMENT_OVERDUE: 'PAYMENT_OVERDUE',
  PAYMENT_DELETED: 'PAYMENT_DELETED',
  PAYMENT_RESTORED: 'PAYMENT_RESTORED',
  PAYMENT_REFUNDED: 'PAYMENT_REFUNDED',
  PAYMENT_RECEIVED_IN_CASH_UNDONE: 'PAYMENT_RECEIVED_IN_CASH_UNDONE',
  PAYMENT_CHARGEBACK_REQUESTED: 'PAYMENT_CHARGEBACK_REQUESTED',
  PAYMENT_CHARGEBACK_DISPUTE: 'PAYMENT_CHARGEBACK_DISPUTE',
  PAYMENT_AWAITING_CHARGEBACK_REVERSAL: 'PAYMENT_AWAITING_CHARGEBACK_REVERSAL',
  PAYMENT_DUNNING_RECEIVED: 'PAYMENT_DUNNING_RECEIVED',
  PAYMENT_DUNNING_REQUESTED: 'PAYMENT_DUNNING_REQUESTED',
} as const;

export const POLLING_CONFIG = {
  INTERVAL: 5000, // 5 segundos
  MAX_ATTEMPTS: 60, // 5 minutos
  TIMEOUT: 300000, // 5 minutos
} as const;

export const ERROR_MESSAGES = {
  INVALID_CPF_CNPJ: 'CPF/CNPJ inválido',
  INVALID_CEP: 'CEP inválido',
  INVALID_PHONE: 'Telefone inválido',
  INVALID_CARD_NUMBER: 'Número do cartão inválido',
  INVALID_CARD_EXPIRY: 'Data de validade inválida',
  INVALID_CVV: 'CVV inválido',
  PAYMENT_FAILED: 'Falha no processamento do pagamento',
  CUSTOMER_CREATION_FAILED: 'Falha ao criar cliente',
  PAYMENT_STATUS_FAILED: 'Falha ao consultar status do pagamento',
  WEBHOOK_VALIDATION_FAILED: 'Falha na validação do webhook',
  INSUFFICIENT_FUNDS: 'Saldo insuficiente',
  CARD_DECLINED: 'Cartão recusado',
  EXPIRED_CARD: 'Cartão expirado',
  INVALID_CARD: 'Cartão inválido',
  NETWORK_ERROR: 'Erro de conexão',
  TIMEOUT_ERROR: 'Tempo limite excedido',
} as const;

export const SUCCESS_MESSAGES = {
  PAYMENT_PROCESSED: 'Pagamento processado com sucesso',
  PIX_GENERATED: 'QR Code PIX gerado com sucesso',
  PAYMENT_CONFIRMED: 'Pagamento confirmado',
  CUSTOMER_CREATED: 'Cliente criado com sucesso',
} as const;

export const MASK_PATTERNS = {
  CPF: '000.000.000-00',
  CNPJ: '00.000.000/0000-00',
  PHONE: '(00) 00000-0000',
  CEP: '00000-000',
  CARD_NUMBER: '0000 0000 0000 0000',
  CARD_EXPIRY: '00/00',
  CVV: '000',
} as const;

export const STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
] as const;

export const CARD_BRANDS = {
  VISA: 'visa',
  MASTERCARD: 'mastercard',
  ELO: 'elo',
  AMEX: 'amex',
  HIPERCARD: 'hipercard',
  DISCOVER: 'discover',
  JCB: 'jcb',
} as const;

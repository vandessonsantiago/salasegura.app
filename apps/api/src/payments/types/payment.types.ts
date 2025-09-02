// MÓDULO PAYMENTS - TIPOS E INTERFACES

// Interface para dados do cliente
export interface ClienteData {
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
}

// Interface para dados do checkout
export interface CheckoutData {
  cliente: ClienteData;
  valor: number;
  descricao: string;
  serviceType: string;
  serviceData?: any;
  data?: string;
  horario?: string;
  userId?: string;
  calendarEventId?: string;
  googleMeetLink?: string;
}

// Interface para resposta do checkout
export interface CheckoutResponse {
  success: boolean;
  agendamentoId?: string;
  paymentId?: string;
  qrCodePix?: string;
  copyPastePix?: string;
  pixExpiresAt?: string;
  error?: string;
}

// Interface para resposta do pagamento
export interface PaymentResponse {
  success: boolean;
  paymentId?: string;
  qrCodePix?: string;
  copyPastePix?: string;
  pixExpiresAt?: string;
  error?: string;
}

// Interface para dados do pagamento Asaas
export interface AsaasPaymentData {
  customer: string; // ID do cliente no Asaas
  billingType: string;
  value: number;
  dueDate: string;
  description: string;
  externalReference?: string;
}

// Interface para resposta da criação de cliente Asaas
export interface AsaasCustomerResponse {
  success: boolean;
  customerId?: string;
  error?: string;
}

// Interface para dados de atualização de status
export interface PaymentStatusUpdate {
  id: string;
  status: string;
  paymentDate?: string;
  value?: number;
}

// Tipos de serviço suportados
export type ServiceType = 'agendamento' | 'divorcio' | 'checklist';

// Configuração Asaas
export interface AsaasConfig {
  BASE_URL: string;
  API_KEY: string;
}

// Status de pagamento possíveis
export type PaymentStatus =
  | 'PENDING'
  | 'RECEIVED'
  | 'CONFIRMED'
  | 'OVERDUE'
  | 'REFUNDED'
  | 'RECEIVED_IN_CASH'
  | 'REFUND_REQUESTED'
  | 'REFUND_IN_PROGRESS'
  | 'CHARGEBACK_REQUESTED'
  | 'CHARGEBACK_DISPUTE'
  | 'AWAITING_CHARGEBACK_REVERSAL'
  | 'DUNNING_REQUESTED'
  | 'DUNNING_RECEIVED'
  | 'AWAITING_RISK_ANALYSIS';

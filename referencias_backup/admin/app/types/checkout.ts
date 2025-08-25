// Tipos para o sistema de checkout Asaas

export interface Customer {
  id?: string;
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
  postalCode?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  city?: string;
  state?: string;
}

export interface CreditCardData {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
}

export interface PaymentRequest {
  customer: Customer;
  billingType: 'PIX' | 'CREDIT_CARD';
  value: number;
  dueDate: string;
  description: string;
  creditCard?: CreditCardData;
  creditCardHolderInfo?: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    phone: string;
  };
  remoteIp?: string;
}

export interface PaymentResponse {
  id: string;
  customer: string;
  subscription?: string;
  installment?: string;
  installmentNumber?: number;
  installmentDescription?: string;
  paymentLink?: string;
  value: number;
  netValue: number;
  originalValue?: number;
  interestValue?: number;
  description: string;
  billingType: string;
  status: string;
  dueDate: string;
  originalDueDate: string;
  paymentDate?: string;
  clientPaymentDate?: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  transactionReceiptUrl?: string;
  discount?: {
    value: number;
    dueDateLimitDays: number;
    type: string;
  };
  fine?: {
    value: number;
  };
  interest?: {
    value: number;
  };
  postalService?: boolean;
  pixQrCode?: string;
  pixCopyAndPaste?: string;
  refunded?: boolean;
  refundedValue?: number;
  refundedDate?: string;
  chargeback?: {
    status: string;
    value: number;
    reason?: string;
  };
  split?: Array<{
    walletId: string;
    fixedValue?: number;
    percentualValue?: number;
    totalFee?: number;
    totalFeeAsPercentual?: number;
  }>;
}

export interface CheckoutComponentProps {
  value: number;
  productName: string;
  productDescription: string;
  customerId?: string;
  onSuccess: (paymentId: string, status: string, pixData?: { qrCode?: string; copyPaste?: string }) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

export interface PaymentStatus {
  id: string;
  status: string;
  value: number;
  paymentDate?: string;
}

export interface WebhookEvent {
  event: string;
  payment: PaymentResponse;
  subscription?: any;
  installment?: any;
  customer?: any;
  transfer?: any;
  invoice?: any;
  chargeback?: any;
  antcipation?: any;
  subscriptionPayment?: any;
  installmentPayment?: any;
  transferReceived?: any;
  invoiceCreated?: any;
  invoiceOverdue?: any;
  invoiceCanceled?: any;
  chargebackCreated?: any;
  chargebackCanceled?: any;
  antcipationCreated?: any;
  antcipationCanceled?: any;
  subscriptionPaymentCreated?: any;
  subscriptionPaymentOverdue?: any;
  subscriptionPaymentCanceled?: any;
  installmentPaymentCreated?: any;
  installmentPaymentOverdue?: any;
  installmentPaymentCanceled?: any;
  transferReceivedCreated?: any;
  transferReceivedCanceled?: any;
}

export type PaymentMethod = 'PIX' | 'CREDIT_CARD';

export interface CheckoutFormData {
  name: string;
  email: string;
  cpfCnpj: string;
  phone: string;
  postalCode: string;
  address: string;
  addressNumber: string;
  complement?: string;
  city: string;
  state: string;
  paymentMethod: PaymentMethod;
  // Campos específicos do cartão
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
  cardHolderName: string;
}

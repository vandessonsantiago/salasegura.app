import { z } from 'zod';

// Schema para CPF/CNPJ
const cpfCnpjSchema = z
  .string()
  .min(11, 'CPF/CNPJ deve ter pelo menos 11 dígitos')
  .max(18, 'CPF/CNPJ deve ter no máximo 18 dígitos')
  .regex(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$|^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/, 'CPF/CNPJ inválido');

// Schema para CEP
const cepSchema = z
  .string()
  .regex(/^\d{5}-?\d{3}$/, 'CEP deve estar no formato 00000-000');

// Schema para telefone
const phoneSchema = z
  .string()
  .regex(/^\(\d{2}\)\s?\d{4,5}-?\d{4}$/, 'Telefone deve estar no formato (11) 99999-9999');

// Schema para número do cartão
const cardNumberSchema = z
  .string()
  .regex(/^\d{4}\s\d{4}\s\d{4}\s\d{4}$/, 'Número do cartão deve estar no formato 0000 0000 0000 0000');

// Schema para validade do cartão
const cardExpirySchema = z
  .string()
  .regex(/^\d{2}\/\d{2}$/, 'Validade deve estar no formato MM/AA');

// Schema para CVV
const cardCvvSchema = z
  .string()
  .regex(/^\d{3,4}$/, 'CVV deve ter 3 ou 4 dígitos');

// Schema base para dados pessoais
const personalDataSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  cpfCnpj: cpfCnpjSchema,
  phone: phoneSchema,
  postalCode: cepSchema,
  address: z.string().min(5, 'Endereço deve ter pelo menos 5 caracteres'),
  addressNumber: z.string().min(1, 'Número é obrigatório'),
  complement: z.string().optional(),
  city: z.string().min(2, 'Cidade deve ter pelo menos 2 caracteres'),
  state: z.string().length(2, 'Estado deve ter 2 caracteres'),
});

// Schema para dados do cartão
const creditCardSchema = z.object({
  cardNumber: cardNumberSchema,
  cardExpiry: cardExpirySchema,
  cardCvv: cardCvvSchema,
  cardHolderName: z.string().min(2, 'Nome do titular deve ter pelo menos 2 caracteres'),
});

// Schema completo do formulário
export const checkoutFormSchema = z.object({
  ...personalDataSchema.shape,
  paymentMethod: z.enum(['PIX', 'CREDIT_CARD'], {
    required_error: 'Selecione um método de pagamento',
  }),
  cardNumber: cardNumberSchema.optional(),
  cardExpiry: cardExpirySchema.optional(),
  cardCvv: cardCvvSchema.optional(),
  cardHolderName: z.string().min(2, 'Nome do titular deve ter pelo menos 2 caracteres').optional(),
}).refine((data: any) => {
  // Se o método de pagamento for cartão, os campos do cartão são obrigatórios
  if (data.paymentMethod === 'CREDIT_CARD') {
    return data.cardNumber && data.cardExpiry && data.cardCvv && data.cardHolderName;
  }
  return true;
}, {
  message: 'Todos os campos do cartão são obrigatórios',
  path: ['cardNumber'], // Campo que será marcado como erro
});

// Schema para validação de pagamento
export const paymentRequestSchema = z.object({
  customer: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    cpfCnpj: cpfCnpjSchema,
    phone: phoneSchema.optional(),
    postalCode: cepSchema.optional(),
    address: z.string().optional(),
    addressNumber: z.string().optional(),
    complement: z.string().optional(),
    province: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
  }),
  billingType: z.enum(['PIX', 'CREDIT_CARD']),
  value: z.number().positive('Valor deve ser positivo'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  creditCard: creditCardSchema.optional(),
  creditCardHolderInfo: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    cpfCnpj: cpfCnpjSchema,
    postalCode: cepSchema,
    addressNumber: z.string().min(1),
    phone: phoneSchema,
  }).optional(),
  remoteIp: z.string().optional(),
});

// Schema para resposta de pagamento
export const paymentResponseSchema = z.object({
  id: z.string(),
  customer: z.string(),
  value: z.number(),
  netValue: z.number(),
  description: z.string(),
  billingType: z.string(),
  status: z.string(),
  dueDate: z.string(),
  originalDueDate: z.string(),
  paymentDate: z.string().optional(),
  clientPaymentDate: z.string().optional(),
  invoiceUrl: z.string().optional(),
  bankSlipUrl: z.string().optional(),
  transactionReceiptUrl: z.string().optional(),
  pixQrCode: z.string().optional(),
  pixCopyAndPaste: z.string().optional(),
  refunded: z.boolean().optional(),
  refundedValue: z.number().optional(),
  refundedDate: z.string().optional(),
});

// Schema para status de pagamento
export const paymentStatusSchema = z.object({
  id: z.string(),
  status: z.string(),
  value: z.number(),
  paymentDate: z.string().optional(),
});

// Schema para webhook
export const webhookEventSchema = z.object({
  event: z.string(),
  payment: paymentResponseSchema,
  subscription: z.any().optional(),
  installment: z.any().optional(),
  customer: z.any().optional(),
  transfer: z.any().optional(),
  invoice: z.any().optional(),
  chargeback: z.any().optional(),
  antcipation: z.any().optional(),
  subscriptionPayment: z.any().optional(),
  installmentPayment: z.any().optional(),
  transferReceived: z.any().optional(),
  invoiceCreated: z.any().optional(),
  invoiceOverdue: z.any().optional(),
  invoiceCanceled: z.any().optional(),
  chargebackCreated: z.any().optional(),
  chargebackCanceled: z.any().optional(),
  antcipationCreated: z.any().optional(),
  antcipationCanceled: z.any().optional(),
  subscriptionPaymentCreated: z.any().optional(),
  subscriptionPaymentOverdue: z.any().optional(),
  subscriptionPaymentCanceled: z.any().optional(),
  installmentPaymentCreated: z.any().optional(),
  installmentPaymentOverdue: z.any().optional(),
  installmentPaymentCanceled: z.any().optional(),
  transferReceivedCreated: z.any().optional(),
  transferReceivedCanceled: z.any().optional(),
});

// Tipos inferidos dos schemas
export type CheckoutFormData = z.infer<typeof checkoutFormSchema>;
export type PaymentRequest = z.infer<typeof paymentRequestSchema>;
export type PaymentResponse = z.infer<typeof paymentResponseSchema>;
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;
export type WebhookEvent = z.infer<typeof webhookEventSchema>;

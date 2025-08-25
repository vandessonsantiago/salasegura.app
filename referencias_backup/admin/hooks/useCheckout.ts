import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { checkoutFormSchema, type CheckoutFormData } from '../app/lib/checkout-schemas';
import { PAYMENT_METHODS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../app/lib/checkout-constants';
import type { PaymentResponse, CheckoutComponentProps } from '../app/types/checkout';
import { api } from '../lib/api';

interface UseCheckoutProps {
  value: number;
  productName: string;
  productDescription: string;
  customerId?: string;
  onSuccess: CheckoutComponentProps['onSuccess'];
  onError?: CheckoutComponentProps['onError'];
}

interface UseCheckoutReturn {
  form: ReturnType<typeof useForm<CheckoutFormData>>;
  isLoading: boolean;
  paymentData: PaymentResponse | null;
  isPixPayment: boolean;
  isCardPayment: boolean;
  handleSubmit: (data: CheckoutFormData) => Promise<void>;
  resetCheckout: () => void;
}

export function useCheckout({
  value,
  productName,
  productDescription,
  customerId,
  onSuccess,
  onError,
}: UseCheckoutProps): UseCheckoutReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentResponse | null>(null);

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      name: '',
      email: '',
      cpfCnpj: '',
      phone: '',
      postalCode: '',
      address: '',
      addressNumber: '',
      complement: '',
      city: '',
      state: '',
      paymentMethod: PAYMENT_METHODS.PIX,
      cardNumber: '',
      cardExpiry: '',
      cardCvv: '',
      cardHolderName: '',
    },
  });

  const isPixPayment = form.watch('paymentMethod') === PAYMENT_METHODS.PIX;
  const isCardPayment = form.watch('paymentMethod') === PAYMENT_METHODS.CREDIT_CARD;

  const handleSubmit = useCallback(async (data: CheckoutFormData) => {
    console.log('🚀 Iniciando checkout com dados:', data);
    setIsLoading(true);
    
    try {
      // Preparar dados do cliente
      const customerData = {
        name: data.name,
        email: data.email,
        cpfCnpj: data.cpfCnpj.replace(/\D/g, ''), // Remove caracteres não numéricos
        phone: data.phone,
        postalCode: data.postalCode.replace(/\D/g, ''),
        address: data.address,
        addressNumber: data.addressNumber,
        complement: data.complement,
        city: data.city,
        state: data.state,
      };

      // Preparar dados do pagamento
      const paymentRequest: any = {
        customer: customerData,
        billingType: data.paymentMethod,
        value: value,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Amanhã
        description: `${productName} - ${productDescription}`,
        customerId: customerId,
      };

      // Adicionar dados específicos do cartão se necessário
      if (data.paymentMethod === PAYMENT_METHODS.CREDIT_CARD) {
        if (!data.cardExpiry || !data.cardNumber) {
          throw new Error('Dados do cartão incompletos');
        }
        
        const [expiryMonth, expiryYear] = data.cardExpiry.split('/');
        
        paymentRequest.creditCard = {
          holderName: data.cardHolderName,
          number: data.cardNumber.replace(/\s/g, ''),
          expiryMonth,
          expiryYear: `20${expiryYear}`,
          ccv: data.cardCvv,
        };

        paymentRequest.creditCardHolderInfo = {
          name: data.name,
          email: data.email,
          cpfCnpj: data.cpfCnpj.replace(/\D/g, ''),
          postalCode: data.postalCode.replace(/\D/g, ''),
          addressNumber: data.addressNumber,
          phone: data.phone,
        };
      }

      // Enviar requisição para o backend usando base URL configurável
      console.log('📤 Enviando requisição para:', `${api.baseUrl}/api/v1/checkout`);
      console.log('📦 Dados enviados:', paymentRequest);

      const paymentResponse: PaymentResponse = await api.fetch('/api/v1/checkout', {
        method: 'POST',
        body: JSON.stringify(paymentRequest),
      });
      console.log('✅ Pagamento criado:', paymentResponse);
      console.log('🔍 Dados PIX recebidos:', {
        pixQrCode: paymentResponse.pixQrCode,
        pixCopyAndPaste: paymentResponse.pixCopyAndPaste
      });
      setPaymentData(paymentResponse);

      // Chamar callback de sucesso com dados do PIX
      if (data.paymentMethod === PAYMENT_METHODS.PIX) {
        onSuccess(paymentResponse.id, paymentResponse.status, {
          qrCode: paymentResponse.pixQrCode,
          copyPaste: paymentResponse.pixCopyAndPaste
        });
      } else {
        onSuccess(paymentResponse.id, paymentResponse.status);
      }

    } catch (error) {
      console.error('Erro no checkout:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : ERROR_MESSAGES.PAYMENT_FAILED;
      
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [value, productName, productDescription, customerId, onSuccess, onError]);

  const resetCheckout = useCallback(() => {
    form.reset();
    setPaymentData(null);
    setIsLoading(false);
  }, [form]);

  return {
    form,
    isLoading,
    paymentData,
    isPixPayment,
    isCardPayment,
    handleSubmit,
    resetCheckout,
  };
}

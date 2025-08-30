"use client"

import React, { useState, useEffect } from "react"
import { QRCodeSVG } from "qrcode.react"
import { CopyIcon, CheckIcon, QrCodeIcon, CheckCircleIcon } from "@phosphor-icons/react"
import { isAsaasPaymentCompleted } from "@/lib/checkout-utils"
import { PixData, CheckoutComponentProps, useSimpleCheckout } from "@/hooks/useCheckout"

// Interface para hooks especializados
interface SpecializedCheckoutHook {
  formData: {
    name: string;
    email: string;
    cpfCnpj: string;
    phone: string;
  };
  paymentData: PixData | null;
  isLoading: boolean;
  handleInputChange: (field: "name" | "email" | "cpfCnpj" | "phone", value: string) => void;
  generatePix: (value: number, serviceData?: any) => Promise<PixData>;
  resetCheckout: () => void;
}

export default function CheckoutComponent({
  value,
  productName,
  productDescription,
  customerId,
  onSuccess,
  onError,
  onCancel,
  existingPixData, // Novo prop para dados PIX existentes
  checkoutHook, // Novo prop para hook especializado
  initialCustomerData, // Novo prop para dados pré-preenchidos
}: CheckoutComponentProps & { 
  existingPixData?: {
    qrCodePix?: string;
    copyPastePix?: string;
    pixExpiresAt?: string;
    paymentId?: string;
  };
  checkoutHook?: SpecializedCheckoutHook;
  initialCustomerData?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}) {

  console.log("🎯 [FRONTEND] CheckoutComponent inicializado");
  console.log("💰 [FRONTEND] Value:", value);
  console.log("📦 [FRONTEND] Product Name:", productName);
  console.log("📝 [FRONTEND] Product Description:", productDescription);
  console.log("👤 [FRONTEND] Customer ID:", customerId);

  const [step, setStep] = useState<'form' | 'pix' | 'error'>('form')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [copiedPix, setCopiedPix] = useState(false)
  const [paymentVerified, setPaymentVerified] = useState(false)
  const [verifyingPayment, setVerifyingPayment] = useState(false)
  const [existingPaymentData, setExistingPaymentData] = useState<PixData | null>(null)

  // Verificar se existe PIX válido
  const hasValidExistingPix = existingPixData?.qrCodePix && 
                              existingPixData?.copyPastePix && 
                              existingPixData?.pixExpiresAt && 
                              new Date(existingPixData.pixExpiresAt) > new Date()

  // Inicializar com dados PIX existentes se válidos
  useEffect(() => {
    if (hasValidExistingPix && existingPixData) {
      const pixData: PixData = {
        id: existingPixData.paymentId,
        qrCode: existingPixData.qrCodePix || '',
        copyPaste: existingPixData.copyPastePix || '',
        expiresAt: existingPixData.pixExpiresAt || '',
      }
      setExistingPaymentData(pixData)
      setStep('pix')
    }
  }, [hasValidExistingPix, existingPixData])

  const {
    formData,
    isLoading,
    paymentData,
    handleInputChange,
    generatePix,
    resetCheckout,
  } = checkoutHook || useSimpleCheckout(initialCustomerData)

  // Usar dados existentes ou do hook
  const currentPaymentData = existingPaymentData || paymentData

  const handleCopyPix = async () => {
    if (currentPaymentData?.copyPaste) {
      try {
        await navigator.clipboard.writeText(currentPaymentData.copyPaste)
        setCopiedPix(true)
        setTimeout(() => setCopiedPix(false), 2000)
      } catch (err) {
        console.error('Erro ao copiar:', err)
      }
    }
  }

  // Função para verificar se o status indica pagamento concluído
  const isPaymentCompleted = (status: string): boolean => {
    return isAsaasPaymentCompleted(status);
  };

  // Polling automático para verificar status do pagamento
  useEffect(() => {
    if (!currentPaymentData?.id || paymentVerified) {
      return;
    }

    console.log("🔄 [FRONTEND] Iniciando polling automático para payment:", currentPaymentData?.id || 'undefined');

    const interval = setInterval(async () => {
      try {
        console.log("🔍 [FRONTEND] Verificação automática de status...");
        const response = await fetch(`http://localhost:8001/api/v1/checkout/status/${currentPaymentData?.id || ''}`);

        if (!response.ok) {
          console.warn("⚠️ [FRONTEND] Falha na verificação automática:", response.status);
          return;
        }

        const data = await response.json();

        if (isPaymentCompleted(data.status) && !paymentVerified) {
          console.log("✅ [FRONTEND] Pagamento detectado automaticamente!");
          setPaymentVerified(true);
          onSuccess(currentPaymentData.id || '', 'CONFIRMED', currentPaymentData);
          clearInterval(interval); // Para o polling quando confirmado
        } else {
          console.log("⏳ [FRONTEND] Status automático:", data.status);
        }
      } catch (error) {
        console.error('Erro na verificação automática:', error);
      }
    }, 5000); // Verifica a cada 5 segundos

    // Cleanup: para o interval quando o componente desmonta ou pagamento é confirmado
    return () => {
      console.log("🛑 [FRONTEND] Parando polling automático");
      clearInterval(interval);
    };
  }, [currentPaymentData?.id, paymentVerified, onSuccess]);

  // Função para verificar status do pagamento em tempo real
  const handleVerifyPayment = async () => {
    console.log("🎯 [FRONTEND] handleVerifyPayment chamado");
    console.log("🎯 [FRONTEND] currentPaymentData:", currentPaymentData);
    console.log("🎯 [FRONTEND] currentPaymentData.id:", currentPaymentData?.id);

    if (!currentPaymentData?.id) {
      console.log("❌ [FRONTEND] Payment ID não encontrado");
      return;
    }

    setVerifyingPayment(true);
    try {
      console.log(`🔍 [FRONTEND] Fazendo requisição para: http://localhost:8001/api/v1/checkout/status/${currentPaymentData?.id || ''}`);
      const response = await fetch(`http://localhost:8001/api/v1/checkout/status/${currentPaymentData?.id || ''}`);
      console.log("📡 [FRONTEND] Resposta da API:", response);

      const data = await response.json();
      console.log("📊 [FRONTEND] Dados recebidos:", data);

      if (isPaymentCompleted(data.status) && !paymentVerified) {
        console.log("✅ [FRONTEND] Pagamento confirmado!");
        setPaymentVerified(true);
        // Atualizar status para CONFIRMED (status interno)
        onSuccess(currentPaymentData?.id || '', 'CONFIRMED', currentPaymentData);
      } else {
        console.log("⏳ [FRONTEND] Status do pagamento:", data.status);
      }
    } catch (error) {
      console.error('Erro ao verificar pagamento:', error)
    } finally {
      setVerifyingPayment(false)
    }
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.cpfCnpj || !formData.phone) {
      onError?.('Por favor, preencha todos os campos')
      return
    }

    console.log("🚀 [FRONTEND] Iniciando geração de PIX...");
    console.log("📝 [FRONTEND] Form data:", formData);
    console.log("💰 [FRONTEND] Value sendo enviado:", value);

    try {
      console.log("🚀 [FRONTEND] Chamando generatePix...");
      const pixData = await generatePix(value)
      console.log("✅ [FRONTEND] PIX gerado com sucesso!");
      console.log("📋 [FRONTEND] Dados PIX recebidos:", pixData);
      console.log("🆔 [FRONTEND] PIX ID:", pixData?.id);

      if (pixData) {
        console.log('PIX gerado com sucesso, enviando dados para o componente pai:', pixData)
        onSuccess(pixData.id || '', 'PENDING', pixData)
      }
      setStep('pix')
    } catch (error) {
      console.error("❌ [FRONTEND] Erro ao gerar PIX:", error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao gerar PIX'
      setErrorMessage(errorMessage)
      setStep('error')
      onError?.(errorMessage)
    }
  }

  const handleBack = () => {
    if (step === 'pix' || step === 'error') {
      setStep('form')
      resetCheckout()
      setPaymentVerified(false)
      setVerifyingPayment(false)
      setErrorMessage('')
    } else {
      onCancel?.()
    }
  }

  if (step === 'form') {
    return (
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[95vh] overflow-hidden shadow-2xl transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                Checkout PIX
              </h2>
              <p className="text-gray-600 mt-2">
                Preencha seus dados para gerar o pagamento
              </p>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl p-3 transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[60vh] px-8 py-6">
          {/* Product Info */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8 border border-blue-200">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">{productName}</h3>
                <p className="text-gray-600 text-sm">{productDescription}</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  R$ {value.toFixed(2).replace('.', ',')}
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nome completo</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Seu nome completo"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="seu@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">CPF</label>
                <input
                  type="text"
                  value={formData.cpfCnpj}
                  onChange={(e) => handleInputChange('cpfCnpj', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="000.000.000-00"
                  maxLength={14}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Telefone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                  required
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-8 py-8 border-t border-gray-200">
          <div className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button
                onClick={onCancel}
                className="flex-1 px-8 py-4 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium text-base"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                onClick={handleFormSubmit}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-semibold text-base shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-3"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Gerando PIX...
                  </>
                ) : (
                  <>
                    <QrCodeIcon size={20} />
                    Pagar com PIX
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'pix' && currentPaymentData) {
    return (
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[95vh] overflow-hidden shadow-2xl transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-8 py-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                Pagamento PIX
              </h2>
              <p className="text-gray-600 mt-2">
                Escaneie o QR Code ou copie o código PIX
              </p>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl p-3 transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[60vh] px-8 py-6">
          {/* Valor */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 mb-8 border border-green-200">
            <div className="text-center">
              <div className="text-sm text-green-700 font-medium mb-2">Valor do pagamento</div>
              <div className="text-3xl font-bold text-green-800">
                R$ {value.toFixed(2).replace('.', ',')}
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 mb-8 flex justify-center">
            <QRCodeSVG value={currentPaymentData.qrCode} size={220} />
          </div>

          {/* Código PIX Copia e Cola */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Código PIX (Copie e Cole)
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={currentPaymentData.copyPaste}
                readOnly
                className="flex-1 bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleCopyPix}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
              >
                {copiedPix ? <CheckIcon size={18} /> : <CopyIcon size={18} />}
                {copiedPix ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
          </div>

          {/* Status de verificação */}
          {paymentVerified && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircleIcon size={20} className="text-green-600" />
                </div>
                <div>
                  <span className="text-green-800 text-base font-semibold">
                    Pagamento confirmado com sucesso!
                  </span>
                  <p className="text-green-600 text-sm mt-1">
                    O modal será fechado automaticamente em alguns segundos.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Informações */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8">
            <div className="text-center">
              <p className="text-gray-700 text-sm leading-relaxed">
                Após o pagamento, clique em <strong>"Já paguei"</strong> para verificar o status automaticamente.
              </p>
              <p className="text-gray-600 text-xs mt-2">
                O código PIX expira em 24 horas.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-8 py-8 border-t border-gray-200">
          <div className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button
                onClick={handleBack}
                className="flex-1 px-8 py-4 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium text-base"
              >
                Voltar
              </button>
              <button
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-4 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 font-semibold text-base shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-3"
                onClick={handleVerifyPayment}
                disabled={verifyingPayment || paymentVerified}
              >
                {verifyingPayment ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Verificando...
                  </>
                ) : paymentVerified ? (
                  <>
                    <CheckCircleIcon size={20} />
                    Pagamento Confirmado!
                  </>
                ) : (
                  <>
                    <CheckIcon size={20} />
                    Já paguei
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'error') {
    return (
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[95vh] overflow-hidden shadow-2xl transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-50 to-pink-50 px-8 py-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                Problema Técnico
              </h2>
              <p className="text-gray-600 mt-2">
                Não foi possível gerar o PIX automaticamente
              </p>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl p-3 transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[60vh] px-8 py-6">
          {/* Mensagem de erro */}
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                  Erro na geração do PIX
                </h3>
                <p className="text-red-700 text-sm leading-relaxed">
                  {errorMessage || "Ocorreu um problema técnico ao gerar o código PIX. Nossa equipe já foi notificada e estamos trabalhando para resolver."}
                </p>
              </div>
            </div>
          </div>

          {/* Opções para o usuário */}
          <div className="space-y-4 mb-8">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              O que você pode fazer:
            </h4>

            <div className="grid gap-4">
              {/* Tentar novamente */}
              <button
                onClick={() => {
                  setStep('form')
                  setErrorMessage('')
                }}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 rounded-xl text-sm font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Tentar Novamente
              </button>

              {/* Entrar em contato */}
              <button
                onClick={() => {
                  const message = encodeURIComponent(
                    `Olá! Tive um problema ao gerar o PIX para o valor de R$ ${value.toFixed(2)}. Erro: ${errorMessage || 'Erro desconhecido'}`
                  )
                  window.open(`https://wa.me/5511999999999?text=${message}`, '_blank')
                }}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-xl text-sm font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Entrar em Contato (WhatsApp)
              </button>

              {/* Email de suporte */}
              <button
                onClick={() => {
                  const subject = encodeURIComponent('Problema na geração do PIX')
                  const body = encodeURIComponent(
                    `Olá!\n\nTive um problema ao gerar o PIX no valor de R$ ${value.toFixed(2)}.\n\nErro técnico: ${errorMessage || 'Erro desconhecido'}\n\nDados do formulário:\n- Nome: ${formData.name}\n- Email: ${formData.email}\n- CPF: ${formData.cpfCnpj}\n- Telefone: ${formData.phone}\n\nPor favor, entrem em contato para resolver este problema.\n\nAtenciosamente,\n${formData.name}`
                  )
                  window.open(`mailto:suporte@salasegura.com?subject=${subject}&body=${body}`)
                }}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-4 rounded-xl text-sm font-semibold hover:from-purple-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Enviar Email de Suporte
              </button>
            </div>
          </div>

          {/* Informações adicionais */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
            <div className="text-center">
              <p className="text-gray-700 text-sm leading-relaxed mb-3">
                <strong>Importante:</strong> Mesmo com este problema técnico, você ainda pode prosseguir com seu agendamento.
              </p>
              <p className="text-gray-600 text-xs">
                Nossa equipe entrará em contato em até 24 horas para resolver o pagamento.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-8 py-8 border-t border-gray-200">
          <div className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button
                onClick={handleBack}
                className="flex-1 px-8 py-4 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium text-base"
              >
                Voltar ao Formulário
              </button>
              <button
                onClick={onCancel}
                className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white px-8 py-4 rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 font-semibold text-base shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Cancelar Agendamento
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

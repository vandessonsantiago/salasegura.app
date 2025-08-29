"use client"

import React, { useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { CopyIcon, CheckIcon, QrCodeIcon, CheckCircleIcon } from "@phosphor-icons/react"
import { useSimpleCheckout, CheckoutComponentProps } from "@/hooks/useCheckout"

export default function CheckoutComponent({
  value,
  productName,
  productDescription,
  customerId,
  agendamentoId,
  onSuccess,
  onError,
  onCancel,
}: CheckoutComponentProps & { agendamentoId?: string }) {

  const [step, setStep] = useState<'form' | 'pix'>('form')
  const [copiedPix, setCopiedPix] = useState(false)
  const [paymentVerified, setPaymentVerified] = useState(false)
  const [verifyingPayment, setVerifyingPayment] = useState(false)

  const {
    formData,
    isLoading,
    paymentData,
    handleInputChange,
    generatePix,
    resetCheckout,
  } = useSimpleCheckout()

  const handleCopyPix = async () => {
    if (paymentData?.copyPaste) {
      try {
        await navigator.clipboard.writeText(paymentData.copyPaste)
        setCopiedPix(true)
        setTimeout(() => setCopiedPix(false), 2000)
      } catch (err) {
        console.error('Erro ao copiar:', err)
      }
    }
  }

  // Função para verificar status do pagamento em tempo real
  const handleVerifyPayment = async () => {
    if (!paymentData?.id) return

    setVerifyingPayment(true)
    try {
      const response = await fetch(`http://localhost:8001/api/v1/checkout/status/${paymentData.id}`)
      if (!response.ok) {
        throw new Error('Erro ao verificar pagamento')
      }

      const data = await response.json()
      console.log('Status do pagamento:', data)

      if (data.status === 'CONFIRMED' || data.status === 'RECEIVED') {
        setPaymentVerified(true)
        onSuccess(paymentData.id, data.status, paymentData)

        // Fechar modal após 2 segundos
        setTimeout(() => {
          onCancel?.()
        }, 2000)
      } else if (data.status === 'PENDING') {
        alert('Pagamento ainda está pendente. Aguarde a confirmação ou tente novamente em alguns instantes.')
      } else if (data.status === 'REFUNDED' || data.status === 'CANCELLED') {
        alert('Pagamento foi cancelado ou reembolsado. Entre em contato conosco para mais informações.')
      } else {
        alert(`Status do pagamento: ${data.status}. Entre em contato conosco se precisar de ajuda.`)
      }
    } catch (error) {
      console.error('Erro ao verificar pagamento:', error)

      if (error instanceof TypeError && error.message.includes('fetch')) {
        alert('Erro de conexão. Verifique sua internet e tente novamente.')
      } else {
        alert('Erro ao verificar status do pagamento. Tente novamente.')
      }
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

    try {
      const pixData = await generatePix(value, agendamentoId)
      setStep('pix')
      // NÃO chamar onSuccess aqui - só quando o pagamento for confirmado
      // onSuccess(paymentId, 'PENDING', pixData)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      onError?.(errorMessage)
    }
  }

  const handleBack = () => {
    if (step === 'pix') {
      setStep('form')
      resetCheckout()
      setPaymentVerified(false)
      setVerifyingPayment(false)
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">CPF/CNPJ</label>
                <input
                  type="text"
                  value={formData.cpfCnpj}
                  onChange={(e) => handleInputChange('cpfCnpj', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="000.000.000-00"
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

  if (step === 'pix' && paymentData) {
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
            <QRCodeSVG value={paymentData.qrCode} size={220} />
          </div>

          {/* Código PIX Copia e Cola */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Código PIX (Copie e Cole)
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={paymentData.copyPaste}
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

  return null
}

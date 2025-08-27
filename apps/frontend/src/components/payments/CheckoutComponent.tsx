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
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Checkout PIX</h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <div className="mb-6">
          <h3 className="font-medium">{productName}</h3>
          <p className="text-sm text-gray-600">{productDescription}</p>
          <p className="text-lg font-bold text-green-600 mt-2">
            R$ {value.toFixed(2).replace('.', ',')}
          </p>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome completo</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Seu nome completo"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">CPF/CNPJ</label>
            <input
              type="text"
              value={formData.cpfCnpj}
              onChange={(e) => handleInputChange('cpfCnpj', e.target.value)}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="000.000.000-00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Telefone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="(11) 99999-9999"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Gerando PIX...
              </>
            ) : (
              <>
                <QrCodeIcon size={20} />
                Pagar com PIX
              </>
            )}
          </button>
        </form>
      </div>
    )
  }

  if (step === 'pix' && paymentData) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Pagamento PIX</h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            Fechar
          </button>
        </div>

        <div className="text-center mb-6">
          <p className="text-sm text-gray-600 mb-2">Escaneie o QR Code ou copie o código PIX</p>
          <p className="text-lg font-bold text-green-600">
            R$ {value.toFixed(2).replace('.', ',')}
          </p>
        </div>

        {/* QR Code */}
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-white rounded-lg border">
            <QRCodeSVG value={paymentData.qrCode} size={200} />
          </div>
        </div>

        {/* Código PIX Copia e Cola */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Código PIX Copia e Cola</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={paymentData.copyPaste}
              readOnly
              className="flex-1 border rounded-md px-3 py-2 text-xs bg-gray-50"
            />
            <button
              onClick={handleCopyPix}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1"
            >
              {copiedPix ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
              {copiedPix ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
        </div>

        {/* Status de verificação */}
        {paymentVerified && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircleIcon size={20} className="text-green-600" />
            <span className="text-green-800 text-sm font-medium">
              Pagamento confirmado com sucesso!
            </span>
          </div>
        )}

        {/* Botões de ação */}
        <div className="space-y-3">
          <button
            className="w-full py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold flex items-center justify-center gap-2"
            onClick={handleVerifyPayment}
            disabled={verifyingPayment || paymentVerified}
          >
            {verifyingPayment ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Verificando...
              </>
            ) : paymentVerified ? (
              <>
                <CheckCircleIcon size={20} />
                Pagamento Confirmado!
              </>
            ) : (
              'Já paguei'
            )}
          </button>

          <button
            onClick={handleBack}
            className="w-full py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Voltar
          </button>
        </div>

        <div className="text-center text-sm text-gray-500 mt-4">
          <p>Após o pagamento, clique em "Já paguei" para verificar o status.</p>
          <p>O código PIX expira em 24 horas.</p>
        </div>
      </div>
    )
  }

  return null
}

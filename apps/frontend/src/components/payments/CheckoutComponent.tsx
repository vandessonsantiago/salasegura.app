"use client"

import React, { useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { CopyIcon, CheckIcon, QrCodeIcon } from "@phosphor-icons/react"
import { useSimpleCheckout, CheckoutComponentProps } from "@/hooks/useCheckout"

export default function CheckoutComponent({
  // ...existing code...
  // Função para atualização manual do status de pagamento
    // ...existing code...
  // ...existing code...
  value,
  productName,
  productDescription,
  customerId,
  agendamentoId,
  onSuccess,
  onError,
  onCancel,
}: CheckoutComponentProps & { agendamentoId?: string }) {

  // Função para atualização manual do status de pagamento
  const handleManualPaymentUpdate = async (paymentId: string) => {
    try {
      const res = await fetch("http://localhost:8001/api/v1/payments/manual-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId }),
      })
      if (!res.ok) {
        const txt = await res.text()
        alert("Erro ao atualizar status: " + txt)
        return
      }
      alert("Solicitação de atualização enviada! Aguarde a confirmação do status.")
    } catch (err) {
      alert("Erro ao enviar solicitação: " + err)
    }
  }
  const [step, setStep] = useState<'form' | 'pix'>('form')
  const [copiedPix, setCopiedPix] = useState(false)

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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.cpfCnpj || !formData.phone) {
      onError?.('Por favor, preencha todos os campos')
      return
    }
    
    try {
      const pixData = await generatePix(value, agendamentoId)
      setStep('pix')
      const paymentId = pixData.id || `pix_${Date.now()}`
      onSuccess(paymentId, 'PENDING', pixData)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      onError?.(errorMessage)
    }
  }

  const handleBack = () => {
    if (step === 'pix') {
      setStep('form')
      resetCheckout()
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

        {/* Aviso removido conforme solicitado */}

        <div className="flex justify-center mb-6">
          <div className="p-4 bg-white rounded-lg border">
            <QRCodeSVG value={paymentData.qrCode} size={200} />
          </div>
        </div>

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

        <div className="text-center text-sm text-gray-500 mb-4">
          <p>Após o pagamento, o processamento pode levar de 15 minutos até 1 dia útil. Você pode fechar esta janela.</p>
          <p>O código PIX expira em 24 horas.</p>
        </div>

        <button
          className="w-full py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold mb-2"
          onClick={() => handleManualPaymentUpdate(paymentData?.id || '')}
        >
          Já paguei
        </button>
      </div>
    )
  }

  return null
}

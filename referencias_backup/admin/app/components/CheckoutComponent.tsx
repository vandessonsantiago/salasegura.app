"use client"

// biome-ignore assist/source/organizeImports: // biome-ignore
import { useEffect, useId, useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { toast } from "react-toastify"
import {
  ArrowLeftIcon,
  CheckIcon,
  ClockIcon,
  CopyIcon,
  CreditCardIcon,
  DeviceMobileIcon,
  LightningIcon,
  QrCodeIcon,
  SpinnerIcon,
} from "@phosphor-icons/react"
import { useAgendamentos } from "../../contexts/AgendamentosContext"
import { useCheckout } from "../../hooks/useCheckout"
import { useDirectPaymentSSE } from "../../hooks/useDirectPaymentSSE"
import { PAYMENT_METHODS, STATES } from "../lib/checkout-constants"
import {
  formatCurrency,
  maskCEP,
  maskCVV,
  maskCPFCNPJ,
  maskCardExpiry,
  maskCardNumber,
  maskPhone,
} from "../lib/checkout-utils"
import type { ConsultaAgendada } from "../../contexts/AgendamentosContext"
import type { CheckoutComponentProps } from "../types/checkout"

export default function CheckoutComponent({
  value,
  productName,
  productDescription,
  customerId,
  onSuccess,
  onError,
  onCancel,
}: CheckoutComponentProps) {
  console.log("🎯 CheckoutComponent renderizado com props:", {
    value,
    productName,
    productDescription,
    customerId,
  })
  const [showPixQR, setShowPixQR] = useState(false)
  const [copiedPix, setCopiedPix] = useState(false)
  const [countdown, setCountdown] = useState(300) // 5 minutos
  const [showCountdown, setShowCountdown] = useState(false)
  const [paymentConfirmed, setPaymentConfirmed] = useState(false)
  const [showSuccessScreen, setShowSuccessScreen] = useState(false)
  const { updatePaymentStatusByPaymentId, refresh } = useAgendamentos()

  // A11y: unique IDs for labels/inputs
  const nameId = useId()
  const emailId = useId()
  const cpfCnpjId = useId()
  const phoneId = useId()
  const postalCodeId = useId()
  const addressId = useId()
  const addressNumberId = useId()
  const complementId = useId()
  const cityId = useId()
  const stateId = useId()
  const cardNumberId = useId()
  const cardHolderNameId = useId()
  const cardExpiryId = useId()
  const cardCvvId = useId()
  const pixCopyAndPasteId = useId()

  const {
    form,
    isLoading,
    paymentData,
    isPixPayment,
    isCardPayment,
    handleSubmit,
    resetCheckout,
  } = useCheckout({
    value,
    productName,
    productDescription,
    customerId,
    onSuccess: (paymentId, status, pixData?) => {
      console.log("🎯 onSuccess chamado com:", { paymentId, status, pixData })
      if (isPixPayment) {
        console.log("🎯 Configurando PIX QR...")
        setShowPixQR(true)
        setShowCountdown(true)
        setCountdown(300) // 5 minutos
        toast.success("QR Code PIX gerado com sucesso!")
        // SALVA IMEDIATAMENTE os dados do agendamento com PIX
        onSuccess(paymentId, status, pixData)
      } else {
        toast.success("Pagamento processado com sucesso!")
        onSuccess(paymentId, status)
      }
    },
    onError: (error) => {
      toast.error(error)
      onError?.(error)
    },
  })

  // SSE direto para pagamento PIX
  const { isListening, currentStatus, startListening, stopListening } =
    useDirectPaymentSSE({
      paymentId: paymentData?.id || "",
      onPaymentReceived: () => {
        console.log("🎉 Pagamento confirmado via SSE!")
        setPaymentConfirmed(true)
        setShowCountdown(false) // Parar countdown
        setShowSuccessScreen(true)
        stopListening()

        toast.success("Pagamento confirmado!")

        // atualiza UI imediatamente
        updatePaymentStatusByPaymentId(paymentData?.id || "", "CONFIRMED")

        // Mostrar tela de sucesso por 3 segundos antes de fechar
        setTimeout(() => {
          onSuccess(paymentData?.id || "", "CONFIRMED")
          // refaz o fetch após curto delay para trazer o meet link criado pelo webhook
          setTimeout(() => {
            refresh()
          }, 2000)
        }, 3000)
      },
      onPaymentFailed: (error: string) => {
        toast.error(error)
        onError?.(error)
      },
    })

  // Iniciar SSE quando PIX for gerado
  useEffect(() => {
    console.log(
      `🔍 useEffect SSE - showPixQR: ${showPixQR}, paymentData?.id: ${paymentData?.id}, isPixPayment: ${isPixPayment}`
    )

    if (showPixQR && paymentData?.id && isPixPayment) {
      console.log(
        `🚀 Condições atendidas, iniciando SSE para pagamento ${paymentData.id}`
      )
      startListening()
    } else {
      console.log(`⚠️ Condições não atendidas para iniciar SSE`)
    }
  }, [showPixQR, paymentData?.id, isPixPayment, startListening])

  // Countdown de 5 minutos - PARAR se pagamento for confirmado
  useEffect(() => {
    if (!showCountdown || countdown <= 0 || paymentConfirmed) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setShowCountdown(false)
          // Usar setTimeout para evitar setState durante render
          setTimeout(() => {
            onCancel?.()
          }, 0)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [showCountdown, countdown, onCancel, paymentConfirmed])

  // Copiar código PIX
  const copyPixCode = async () => {
    if (paymentData?.pixCopyAndPaste) {
      try {
        await navigator.clipboard.writeText(paymentData.pixCopyAndPaste)
        setCopiedPix(true)
        toast.success("Código PIX copiado!")
        setTimeout(() => setCopiedPix(false), 2000)
      } catch {
        toast.error("Erro ao copiar código PIX")
      }
    }
  }

  // Cancelar checkout
  const handleCancel = () => {
    if (isListening) {
      stopListening()
    }
    resetCheckout()
    setShowPixQR(false)
    setShowCountdown(false)
    setPaymentConfirmed(false)
    setShowSuccessScreen(false)
    setCountdown(300) // Reset para 5 minutos
    onCancel?.()
  }

  // Função de teste manual para verificar status
  const testPaymentStatus = async () => {
    if (!paymentData?.id) {
      console.log("❌ Nenhum payment ID disponível para teste")
      return
    }

    console.log(
      `🔍 TESTE MANUAL: Verificando status do pagamento ${paymentData.id}`
    )

    try {
      const response = await fetch(`/api/v1/payment-status/${paymentData.id}`)
      const data = await response.json()
      console.log(`📊 TESTE MANUAL: Status recebido:`, data)

      if (data.status === "CONFIRMED" || data.status === "RECEIVED") {
        console.log(
          "✅ TESTE MANUAL: Pagamento está CONFIRMADO! Forçando atualização..."
        )
        setPaymentConfirmed(true)
        setShowCountdown(false)
        setShowSuccessScreen(true)
        stopListening()

        // Simular o callback de sucesso
        setTimeout(() => {
          onSuccess(paymentData.id, data.status)
        }, 3000)
      } else {
        console.log(
          `🟡 TESTE MANUAL: Pagamento ainda pendente com status: ${data.status}`
        )
      }
    } catch (error) {
      console.error("❌ TESTE MANUAL: Erro ao verificar status:", error)
    }
  }

  // Função para reiniciar SSE forçadamente
  const restartTracking = () => {
    console.log(`🔄 TESTE: Reiniciando SSE forçadamente`)
    stopListening()
    setTimeout(() => {
      startListening()
    }, 500)
  }

  // Renderizar formulário de checkout
  const renderCheckoutForm = () => (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {/* Dados Pessoais */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Dados Pessoais</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor={nameId}
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nome Completo *
            </label>
            <input
              id={nameId}
              type="text"
              {...form.register("name")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Digite seu nome completo"
            />
            {form.formState.errors.name && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor={emailId}
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email *
            </label>
            <input
              id={emailId}
              type="email"
              {...form.register("email")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="seu@email.com"
            />
            {form.formState.errors.email && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor={cpfCnpjId}
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              CPF/CNPJ *
            </label>
            <input
              id={cpfCnpjId}
              type="text"
              {...form.register("cpfCnpj")}
              onChange={(e) => {
                const masked = maskCPFCNPJ(e.target.value)
                form.setValue("cpfCnpj", masked)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="000.000.000-00"
            />
            {form.formState.errors.cpfCnpj && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.cpfCnpj.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor={phoneId}
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Telefone *
            </label>
            <input
              id={phoneId}
              type="text"
              {...form.register("phone")}
              onChange={(e) => {
                const masked = maskPhone(e.target.value)
                form.setValue("phone", masked)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="(11) 99999-9999"
            />
            {form.formState.errors.phone && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.phone.message}
              </p>
            )}
          </div>
        </div>

        {/* Endereço */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label
              htmlFor={postalCodeId}
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              CEP *
            </label>
            <input
              id={postalCodeId}
              type="text"
              {...form.register("postalCode")}
              onChange={(e) => {
                const masked = maskCEP(e.target.value)
                form.setValue("postalCode", masked)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="00000-000"
            />
            {form.formState.errors.postalCode && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.postalCode.message}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor={addressId}
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Endereço *
            </label>
            <input
              id={addressId}
              type="text"
              {...form.register("address")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Rua, Avenida, etc."
            />
            {form.formState.errors.address && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.address.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label
              htmlFor={addressNumberId}
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Número *
            </label>
            <input
              id={addressNumberId}
              type="text"
              {...form.register("addressNumber")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="123"
            />
            {form.formState.errors.addressNumber && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.addressNumber.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor={complementId}
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Complemento
            </label>
            <input
              id={complementId}
              type="text"
              {...form.register("complement")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Apto, Casa, etc."
            />
          </div>

          <div>
            <label
              htmlFor={cityId}
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Cidade *
            </label>
            <input
              id={cityId}
              type="text"
              {...form.register("city")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="São Paulo"
            />
            {form.formState.errors.city && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.city.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor={stateId}
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Estado *
            </label>
            <select
              id={stateId}
              {...form.register("state")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Selecione</option>
              {STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
            {form.formState.errors.state && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.state.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Método de Pagamento */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Método de Pagamento
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label
            className={`relative flex cursor-pointer rounded-lg border-2 p-4 shadow-sm focus:outline-none transition-all duration-200 ${
              form.watch("paymentMethod") === PAYMENT_METHODS.PIX
                ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                : "border-gray-300 bg-white hover:border-gray-400"
            }`}
          >
            <input
              type="radio"
              {...form.register("paymentMethod")}
              value={PAYMENT_METHODS.PIX}
              className="sr-only"
            />
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    form.watch("paymentMethod") === PAYMENT_METHODS.PIX
                      ? "border-blue-500 bg-blue-500"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {form.watch("paymentMethod") === PAYMENT_METHODS.PIX && (
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="block text-sm font-medium text-gray-900">
                    PIX
                  </span>
                  <span className="mt-1 flex items-center text-sm text-gray-500">
                    <LightningIcon size={16} weight="fill" className="mr-2" />
                    Pagamento instantâneo
                  </span>
                </div>
              </div>
              <DeviceMobileIcon size={32} weight="fill" />
            </div>
          </label>

          <label
            className={`relative flex cursor-pointer rounded-lg border-2 p-4 shadow-sm focus:outline-none transition-all duration-200 ${
              form.watch("paymentMethod") === PAYMENT_METHODS.CREDIT_CARD
                ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                : "border-gray-300 bg-white hover:border-gray-400"
            }`}
          >
            <input
              type="radio"
              {...form.register("paymentMethod")}
              value={PAYMENT_METHODS.CREDIT_CARD}
              className="sr-only"
            />
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    form.watch("paymentMethod") === PAYMENT_METHODS.CREDIT_CARD
                      ? "border-blue-500 bg-blue-500"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {form.watch("paymentMethod") ===
                    PAYMENT_METHODS.CREDIT_CARD && (
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="block text-sm font-medium text-gray-900">
                    Cartão de Crédito
                  </span>
                  <span className="mt-1 flex items-center text-sm text-gray-500">
                    <CreditCardIcon size={16} weight="fill" className="mr-2" />
                    Visa, Mastercard, etc.
                  </span>
                </div>
              </div>
              <CreditCardIcon size={32} weight="fill" />
            </div>
          </label>
        </div>
      </div>

      {/* Instruções PIX */}
      {isPixPayment && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <LightningIcon size={20} weight="fill" className="text-green-600" />
            <h3 className="text-lg font-semibold text-green-900">
              Pagamento PIX
            </h3>
            <div className="ml-auto text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
              Selecionado
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <QrCodeIcon
                size={20}
                className="text-green-600 mt-0.5"
                weight="fill"
              />
              <div className="text-sm text-green-800">
                <p className="font-medium mb-2">Como pagar com PIX:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Após confirmar, você receberá um QR Code</li>
                  <li>• Escaneie com o app do seu banco</li>
                  <li>• Ou copie o código PIX e cole no app</li>
                  <li>• Pagamento instantâneo e seguro</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Campos do Cartão */}
      {isCardPayment && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <CreditCardIcon size={20} className="text-blue-600" weight="fill" />
            <h3 className="text-lg font-semibold text-blue-900">
              Dados do Cartão
            </h3>
            <div className="ml-auto text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
              Selecionado
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label
                htmlFor={cardNumberId}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Número do Cartão *
              </label>
              <input
                id={cardNumberId}
                type="text"
                {...form.register("cardNumber")}
                onChange={(e) => {
                  const masked = maskCardNumber(e.target.value)
                  form.setValue("cardNumber", masked)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0000 0000 0000 0000"
                maxLength={19}
              />
              {form.formState.errors.cardNumber && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.cardNumber.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor={cardHolderNameId}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nome do Titular *
              </label>
              <input
                id={cardHolderNameId}
                type="text"
                {...form.register("cardHolderName")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Como está no cartão"
              />
              {form.formState.errors.cardHolderName && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.cardHolderName.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor={cardExpiryId}
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Validade *
                </label>
                <input
                  id={cardExpiryId}
                  type="text"
                  {...form.register("cardExpiry")}
                  onChange={(e) => {
                    const masked = maskCardExpiry(e.target.value)
                    form.setValue("cardExpiry", masked)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="MM/AA"
                  maxLength={5}
                />
                {form.formState.errors.cardExpiry && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.cardExpiry.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor={cardCvvId}
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  CVV *
                </label>
                <input
                  id={cardCvvId}
                  type="text"
                  {...form.register("cardCvv")}
                  onChange={(e) => {
                    const masked = maskCVV(e.target.value)
                    form.setValue("cardCvv", masked)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="123"
                  maxLength={4}
                />
                {form.formState.errors.cardCvv && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.cardCvv.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resumo do Pagamento */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Resumo do Pagamento
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Produto:</span>
            <span className="font-medium">{productName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Valor:</span>
            <span className="font-bold text-lg text-green-600">
              {formatCurrency(value)}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
            <span className="text-gray-600">Método:</span>
            <div className="flex items-center space-x-2">
              <span className="text-lg">
                {isPixPayment ? (
                  <LightningIcon size={20} weight="fill" />
                ) : (
                  <CreditCardIcon size={20} weight="fill" />
                )}
              </span>
              <span className="font-medium text-blue-600">
                {isPixPayment ? "PIX" : "Cartão de Crédito"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Botões */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={handleCancel}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={isLoading}
          onClick={() => {
            console.log("🔘 Botão clicado!")
            const formData = form.getValues()
            console.log("📦 Dados do formulário:", formData)
            handleSubmit(formData)
          }}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Processando...
            </div>
          ) : (
            <>
              <span>
                {isPixPayment ? (
                  <LightningIcon size={16} weight="fill" />
                ) : (
                  <CreditCardIcon size={16} weight="fill" />
                )}
              </span>
              <span>
                {isPixPayment ? "Gerar PIX" : "Pagar"} {formatCurrency(value)}
              </span>
            </>
          )}
        </button>
      </div>
    </form>
  )

  // Renderizar tela de sucesso
  const renderSuccessScreen = () => (
    <div className="space-y-6 text-center">
      <div className="bg-green-50 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
        <CheckIcon size={40} weight="fill" className="text-green-600" />
      </div>

      <div>
        <h3 className="text-xl font-semibold text-green-800 mb-2">
          🎉 Pagamento Confirmado!
        </h3>
        <p className="text-gray-600 mb-4">
          Seu pagamento foi processado com sucesso.
        </p>
        <p className="text-sm text-gray-500">
          Você receberá o link da consulta por email em instantes...
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <CheckIcon size={16} className="text-green-600" weight="fill" />
          <span className="text-sm font-medium text-green-800">
            Próximos passos
          </span>
        </div>
        <ul className="text-xs text-green-700 space-y-1 text-left max-w-xs mx-auto">
          <li>• Consulta confirmada no seu calendário</li>
          <li>• Link do Google Meet será enviado por email</li>
          <li>• Aguarde a confirmação completa</li>
        </ul>
      </div>

      <div className="animate-pulse">
        <SpinnerIcon
          size={24}
          className="text-green-600 mx-auto animate-spin"
        />
        <p className="text-xs text-gray-500 mt-2">Finalizando processo...</p>
      </div>
    </div>
  )

  // Renderizar QR Code PIX
  const renderPixQR = () => {
    console.log("🔍 Renderizando PIX QR - paymentData:", paymentData)
    console.log("🔍 pixQrCode:", paymentData?.pixQrCode)
    console.log("🔍 pixCopyAndPaste:", paymentData?.pixCopyAndPaste)

    // Se pagamento foi confirmado, mostrar tela de sucesso
    if (showSuccessScreen || paymentConfirmed) {
      return renderSuccessScreen()
    }

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center justify-center gap-2">
            <QrCodeIcon size={24} weight="fill" className="text-green-600" />
            Pagamento PIX Gerado
          </h3>
          <p className="text-gray-600 mb-4">
            Escaneie o QR Code ou copie o código PIX para pagar
          </p>
        </div>

        <div className="flex flex-col items-center space-y-4">
          {paymentData?.pixQrCode ? (
            <div className="bg-white p-4 rounded-lg border flex justify-center">
              <QRCodeSVG
                value={paymentData.pixQrCode}
                size={200}
                level="M"
                includeMargin={true}
              />
            </div>
          ) : (
            <div
              className="bg-white p-4 rounded-lg border border-gray-300 flex items-center justify-center"
              style={{ width: 200, height: 200 }}
            >
              <div className="text-center">
                <DeviceMobileIcon size={48} weight="light" />
                <p className="text-sm text-gray-500">QR Code PIX</p>
                <p className="text-xs text-gray-400 mt-1">
                  Aguardando dados...
                </p>
              </div>
            </div>
          )}

          {paymentData?.pixCopyAndPaste && (
            <div className="w-full max-w-md">
              <label
                htmlFor={pixCopyAndPasteId}
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Código PIX (Copia e Cola)
              </label>
              <div className="flex gap-2">
                <input
                  id={pixCopyAndPasteId}
                  type="text"
                  value={paymentData.pixCopyAndPaste}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                />
                <button
                  type="button"
                  onClick={copyPixCode}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  {copiedPix ? (
                    <>
                      <CheckIcon size={16} weight="fill" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <CopyIcon size={16} weight="fill" />
                      Copiar
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {isListening && (
            <div className="text-center">
              <SpinnerIcon
                size={32}
                className="text-blue-600 mx-auto mb-2 animate-spin"
              />
              <p className="text-sm text-gray-600">
                Aguardando confirmação do pagamento...
              </p>
              <p className="text-xs text-blue-500 mt-1">Conectado via 🔌 SSE</p>
              {currentStatus && (
                <p className="text-xs text-gray-500 mt-1">
                  Status: {currentStatus}
                </p>
              )}

              {/* Countdown */}
              {showCountdown && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <ClockIcon
                      size={16}
                      className="text-yellow-600"
                      weight="fill"
                    />
                    <span className="text-sm font-medium text-yellow-800">
                      Aguardando pagamento
                    </span>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600 mb-1">
                      {Math.floor(countdown / 60)}:
                      {(countdown % 60).toString().padStart(2, "0")}
                    </div>
                    <p className="text-xs text-yellow-700">
                      {countdown > 60
                        ? `Tempo restante: ${Math.floor(countdown / 60)} min ${countdown % 60}s`
                        : `Modal fechará em ${countdown} segundos`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Botões - não mostrar na tela de sucesso */}
        {!showSuccessScreen && !paymentConfirmed && (
          <div className="space-y-4">
            {/* Botão de teste temporário */}
            {paymentData?.id && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={testPaymentStatus}
                    className="w-full px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                  >
                    🔍 TESTE: Verificar Status Manual
                  </button>
                  <button
                    type="button"
                    onClick={restartTracking}
                    className="w-full px-3 py-2 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 transition-colors"
                  >
                    🔄 TESTE: Reiniciar Tracking
                  </button>
                </div>
                <p className="text-xs text-red-600 mt-1 text-center">
                  Payment ID: {paymentData.id} | SSE:{" "}
                  {isListening ? "✅ Ativo" : "❌ Inativo"} | Status:{" "}
                  {currentStatus || "PENDING"}
                </p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => setShowPixQR(false)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeftIcon size={16} weight="fill" />
                Voltar ao Formulário
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="bg-blue-600 text-white px-6 py-4 flex-shrink-0">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <CreditCardIcon size={24} weight="fill" />
          Checkout - {productName}
        </h2>
        <p className="text-blue-100 text-sm mt-1">{productDescription}</p>
      </div>

      {/* Content */}
      <div className="p-6 overflow-y-auto flex-1 pb-8">
        {showPixQR ? renderPixQR() : renderCheckoutForm()}
      </div>
    </div>
  )
}

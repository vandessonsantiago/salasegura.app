import { useState, useEffect, useCallback, useRef } from "react"
import { PAYMENT_STATUS, POLLING_CONFIG } from "../app/lib/checkout-constants"
import type { PaymentStatus } from "../app/types/checkout"
import { api } from "../lib/api"

interface UsePaymentPollingProps {
  paymentId: string
  onSuccess: (status: PaymentStatus) => void
  onError: (error: string) => void
  onTimeout?: () => void
}

interface UsePaymentPollingReturn {
  isPolling: boolean
  currentStatus: string | null
  attempts: number
  startPolling: () => void
  stopPolling: () => void
  resetPolling: () => void
}

export function usePaymentPolling({
  paymentId,
  onSuccess,
  onError,
  onTimeout,
}: UsePaymentPollingProps): UsePaymentPollingReturn {
  const [isPolling, setIsPolling] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)
  const isPollingRef = useRef(false)

  // Sincronizar ref com estado
  useEffect(() => {
    isPollingRef.current = isPolling
  }, [isPolling]) // Função para consultar status do pagamento
  const checkPaymentStatus = useCallback(async () => {
    if (!paymentId || !isMountedRef.current) return

    try {
      console.log(
        `🔍 Verificando pagamento ${paymentId} - Tentativa ${attempts + 1}`
      )
      console.log(`🔧 API endpoint: /api/v1/payment-status/${paymentId}`)

      const data: PaymentStatus = await api.fetch(
        `/api/v1/payment-status/${paymentId}`
      )

      if (!isMountedRef.current) return

      setCurrentStatus(data.status)
      setAttempts((prev) => prev + 1)

      console.log(`📊 Status do pagamento ${paymentId}: ${data.status}`)
      console.log(`🔍 Dados completos recebidos:`, data)
      console.log(
        `🎯 Status esperados para confirmação: ${PAYMENT_STATUS.CONFIRMED}, ${PAYMENT_STATUS.RECEIVED}`
      )

      // Verificar se o pagamento foi confirmado
      if (
        data.status === PAYMENT_STATUS.CONFIRMED ||
        data.status === PAYMENT_STATUS.RECEIVED
      ) {
        console.log(`✅ Pagamento ${paymentId} confirmado! Parando polling...`)
        setIsPolling(false)
        onSuccess(data)
        return
      }

      // Verificar se o pagamento foi cancelado ou expirou
      if (
        data.status === PAYMENT_STATUS.OVERDUE ||
        data.status === PAYMENT_STATUS.REFUNDED
      ) {
        console.log(`❌ Pagamento ${paymentId} ${data.status.toLowerCase()}`)
        setIsPolling(false)
        onError(`Pagamento ${data.status.toLowerCase()}`)
        return
      }

      // Verificar se excedeu o número máximo de tentativas
      if (attempts >= POLLING_CONFIG.MAX_ATTEMPTS) {
        console.log(
          `⏰ Timeout do polling para pagamento ${paymentId} - Tentativas: ${attempts}/${POLLING_CONFIG.MAX_ATTEMPTS}`
        )
        setIsPolling(false)
        onTimeout?.()
        return
      }

      console.log(
        `🔄 Continuando polling... Próxima tentativa em ${POLLING_CONFIG.INTERVAL}ms`
      )
    } catch (error) {
      if (!isMountedRef.current) return

      console.error("❌ Erro ao consultar status do pagamento:", error)
      console.error("🔧 Detalhes do erro:", {
        paymentId,
        attempts: attempts + 1,
        error: error instanceof Error ? error.message : error,
      })
      setAttempts((prev) => prev + 1)

      // Se excedeu o número máximo de tentativas, parar polling
      if (attempts >= POLLING_CONFIG.MAX_ATTEMPTS) {
        setIsPolling(false)
        onError("Erro ao consultar status do pagamento")
      }
    }
  }, [paymentId, onSuccess, onError, onTimeout, attempts])

  // Função para iniciar polling
  const startPolling = useCallback(() => {
    console.log(
      `🔍 Tentando iniciar polling - isPolling: ${isPollingRef.current}, paymentId: ${paymentId}`
    )

    // Se já está em polling, vamos forçar parar primeiro
    if (isPollingRef.current) {
      console.log(`🔄 Polling já ativo, forçando restart...`)
      stopPolling()
      // Pequeno delay para garantir que tudo foi limpo
      setTimeout(() => {
        startPolling()
      }, 100)
      return
    }

    if (!paymentId) {
      console.log(`⚠️ Polling não iniciado - paymentId não disponível`)
      return
    }

    console.log(`🚀 Iniciando polling para pagamento ${paymentId}`)
    console.log(
      `⚙️ Configuração: intervalo=${POLLING_CONFIG.INTERVAL}ms, máximo=${POLLING_CONFIG.MAX_ATTEMPTS} tentativas, timeout=${POLLING_CONFIG.TIMEOUT}ms`
    )
    setIsPolling(true)
    setAttempts(0)
    setCurrentStatus(null)

    // Primeira verificação imediata
    console.log(`🏁 Fazendo primeira verificação imediata...`)
    checkPaymentStatus()

    // Configurar intervalo para verificações subsequentes
    console.log(`⏰ Configurando intervalo de ${POLLING_CONFIG.INTERVAL}ms`)
    intervalRef.current = setInterval(() => {
      console.log(`🔄 Executando verificação periódica...`)
      checkPaymentStatus()
    }, POLLING_CONFIG.INTERVAL)

    // Configurar timeout geral
    timeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        console.log(`⏰ Timeout geral do polling para pagamento ${paymentId}`)
        setIsPolling(false)
        onTimeout?.()
      }
    }, POLLING_CONFIG.TIMEOUT)
  }, [paymentId, checkPaymentStatus, onTimeout])

  // Função para parar polling
  const stopPolling = useCallback(() => {
    console.log(`🛑 Parando polling...`)
    setIsPolling(false)

    if (intervalRef.current) {
      console.log(`🗑️ Limpando intervalo`)
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (timeoutRef.current) {
      console.log(`🗑️ Limpando timeout`)
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    console.log(`✅ Polling parado e limpo`)
  }, [])

  // Função para resetar polling
  const resetPolling = useCallback(() => {
    stopPolling()
    setAttempts(0)
    setCurrentStatus(null)
  }, [stopPolling])

  // Cleanup ao desmontar componente
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      stopPolling()
    }
  }, [stopPolling])

  return {
    isPolling,
    currentStatus,
    attempts,
    startPolling,
    stopPolling,
    resetPolling,
  }
}

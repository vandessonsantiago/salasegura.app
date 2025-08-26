import { useState, useEffect, useCallback, useRef } from "react"
import type { PaymentStatus } from "../app/types/checkout"
import { useStableSSE } from "./useStableSSE"
import { usePaymentPolling } from "./usePaymentPolling"

interface UsePaymentTrackerProps {
  paymentId: string
  onSuccess: (status: PaymentStatus) => void
  onError: (error: string) => void
  onTimeout?: () => void
  preferWebSocket?: boolean // Default: true (usa SSE como "websocket")
}

interface UsePaymentTrackerReturn {
  isTracking: boolean
  currentStatus: string | null
  connectionType: "websocket" | "polling" | "none" // "websocket" significa SSE agora
  attempts: number
  startTracking: () => void
  stopTracking: () => void
  resetTracking: () => void
}

/**
 * Hook híbrido que usa SSE como principal e polling como fallback
 * Padrão moderno para garantir máxima confiabilidade
 */
export function usePaymentTracker({
  paymentId,
  onSuccess,
  onError,
  onTimeout,
  preferWebSocket = true,
}: UsePaymentTrackerProps): UsePaymentTrackerReturn {
  const [connectionType, setConnectionType] = useState<
    "websocket" | "polling" | "none"
  >("none")
  const [isTracking, setIsTracking] = useState(false)
  const hasWebSocketFailed = useRef(false)
  const fallbackTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // SSE hook (versão estável)
  const {
    isConnected: sseConnected,
    currentStatus: sseStatus,
    connect: sseConnect,
    disconnect: sseDisconnect,
  } = useStableSSE({
    paymentId,
    onSuccess: (status: PaymentStatus) => {
      console.log("🎉 Pagamento confirmado via SSE!")
      setIsTracking(false)
      onSuccess(status)
    },
    onError: (error: string) => {
      console.log("❌ Erro SSE, tentando fallback para polling...")
      hasWebSocketFailed.current = true
      // Não chamar onError ainda, vamos tentar polling
      startPollingFallback()
    },
  })

  // Polling hook (fallback)
  const {
    isPolling,
    currentStatus: pollingStatus,
    attempts: pollingAttempts,
    startPolling,
    stopPolling,
    resetPolling,
  } = usePaymentPolling({
    paymentId,
    onSuccess: (status) => {
      console.log("🎉 Pagamento confirmado via Polling fallback!")
      setIsTracking(false)
      onSuccess(status)
    },
    onError: (error) => {
      console.log("❌ Erro também no Polling fallback")
      setIsTracking(false)
      onError(error)
    },
    onTimeout: () => {
      console.log("⏰ Timeout também no Polling fallback")
      setIsTracking(false)
      onTimeout?.()
    },
  })

  // Função para iniciar polling como fallback
  const startPollingFallback = useCallback(() => {
    if (connectionType === "polling") return

    console.log("🔄 Iniciando polling como fallback...")
    setConnectionType("polling")

    // Delay pequeno para evitar conflitos
    fallbackTimeoutRef.current = setTimeout(() => {
      startPolling()
    }, 1000)
  }, [connectionType, startPolling])

  // Função principal para iniciar tracking
  const startTracking = useCallback(() => {
    if (isTracking) return

    console.log(`🚀 Iniciando tracking para pagamento ${paymentId}`)
    setIsTracking(true)
    hasWebSocketFailed.current = false

    if (preferWebSocket && !hasWebSocketFailed.current) {
      console.log("🔌 Tentando SSE primeiro...")
      setConnectionType("websocket")
      sseConnect()

      // Fallback automático se SSE não conectar em 10 segundos
      fallbackTimeoutRef.current = setTimeout(() => {
        if (!sseConnected && isTracking) {
          console.log("⚠️ SSE não conectou em 10s, mudando para polling...")
          hasWebSocketFailed.current = true
          startPollingFallback()
        }
      }, 10000)
    } else {
      console.log("📊 Usando polling diretamente...")
      setConnectionType("polling")
      startPolling()
    }
  }, [
    isTracking,
    paymentId,
    preferWebSocket,
    sseConnect,
    sseConnected,
    startPolling,
    startPollingFallback,
  ])

  // Função para parar tracking
  const stopTracking = useCallback(() => {
    console.log("🛑 Parando tracking...")
    setIsTracking(false)
    setConnectionType("none")

    sseDisconnect()
    stopPolling()

    if (fallbackTimeoutRef.current) {
      clearTimeout(fallbackTimeoutRef.current)
      fallbackTimeoutRef.current = null
    }
  }, [sseDisconnect, stopPolling])

  // Função para resetar tracking
  const resetTracking = useCallback(() => {
    stopTracking()
    resetPolling()
    hasWebSocketFailed.current = false
  }, [stopTracking, resetPolling])

  // Cleanup
  useEffect(() => {
    return () => {
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current)
      }
    }
  }, [])

  return {
    isTracking: isTracking && (sseConnected || isPolling),
    currentStatus: sseStatus || pollingStatus,
    connectionType,
    attempts: connectionType === "websocket" ? 0 : pollingAttempts, // SSE não tem tentativas
    startTracking,
    stopTracking,
    resetTracking,
  }
}

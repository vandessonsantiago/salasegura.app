import { useState, useEffect, useCallback, useRef } from "react"
import type { PaymentStatus } from "../app/types/checkout"

interface UsePaymentSSEProps {
  paymentId: string
  onSuccess: (status: PaymentStatus) => void
  onError: (error: string) => void
  enabled?: boolean
}

interface UsePaymentSSEReturn {
  isConnected: boolean
  currentStatus: string | null
  connect: () => void
  disconnect: () => void
}

// Função para obter a URL base da API
const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL
  if (process.env.NODE_ENV === "production") {
    return "https://api-salasegura.vandessonsantiago.com"
  }
  return "http://localhost:3002"
}

export function usePaymentSSE({
  paymentId,
  onSuccess,
  onError,
  enabled = true,
}: UsePaymentSSEProps): UsePaymentSSEReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<string | null>(null)

  const eventSourceRef = useRef<EventSource | null>(null)
  const isMountedRef = useRef(true)

  const disconnect = useCallback(() => {
    console.log(`🔌 [SSE] Desconectando...`)

    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    setIsConnected(false)
  }, [])

  const connect = useCallback(() => {
    if (!paymentId || !enabled) {
      console.log("❌ [SSE] PaymentId inválido ou SSE desabilitado")
      return
    }

    if (eventSourceRef.current) {
      console.log("⚠️ [SSE] Conexão já existe, fechando primeiro")
      disconnect()
    }

    console.log(`🔌 [SSE] Conectando para ${paymentId}`)

    const apiBaseUrl = getApiBaseUrl()
    const sseUrl = `${apiBaseUrl}/api/v1/payment-status/${paymentId}/stream`

    console.log(`🌐 [SSE] URL: ${sseUrl}`)

    try {
      const eventSource = new EventSource(sseUrl)
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        if (!isMountedRef.current) return
        console.log(`✅ [SSE] Conectado com sucesso`)
        setIsConnected(true)
      }

      eventSource.onmessage = (event) => {
        if (!isMountedRef.current) return

        try {
          const data = JSON.parse(event.data)
          console.log(`📨 [SSE] Dados recebidos:`, data)

          // Ignorar heartbeats e timeouts
          if (data.heartbeat) {
            console.log("💓 [SSE] Heartbeat")
            return
          }

          if (data.timeout) {
            console.log("⏰ [SSE] Timeout do servidor")
            disconnect()
            onError("Timeout da conexão")
            return
          }

          // Verificar se há erro do servidor
          if (data.error) {
            console.log(`❌ [SSE] Erro do servidor: ${data.error}`)
            disconnect()
            onError(data.error)
            return
          }

          // Processar status do pagamento
          if (data.status) {
            setCurrentStatus(data.status)

            if (data.status === "CONFIRMED" || data.status === "RECEIVED") {
              console.log(`🎉 [SSE] Pagamento confirmado!`)
              disconnect()
              onSuccess(data)
              return
            }

            if (data.status === "OVERDUE" || data.status === "REFUNDED") {
              console.log(`❌ [SSE] Pagamento ${data.status}`)
              disconnect()
              onError(`Pagamento ${data.status.toLowerCase()}`)
              return
            }
          }
        } catch (parseError) {
          console.error("❌ [SSE] Erro ao processar dados:", parseError)
        }
      }

      eventSource.onerror = (event) => {
        if (!isMountedRef.current) return

        console.error(`❌ [SSE] Erro na conexão:`, event)
        console.log(
          `❌ [SSE] EventSource readyState: ${eventSource.readyState}`
        )
        console.log(
          `❌ [SSE] EventSource CONNECTING: ${EventSource.CONNECTING}`
        )
        console.log(`❌ [SSE] EventSource OPEN: ${EventSource.OPEN}`)
        console.log(`❌ [SSE] EventSource CLOSED: ${EventSource.CLOSED}`)

        setIsConnected(false)

        // Apenas chamar onError se a conexão estava estabelecida ou falhou definitivamente
        if (eventSource.readyState === EventSource.CLOSED) {
          onError(`Conexão SSE perdida para pagamento ${paymentId}`)
        }
      }
    } catch (error) {
      console.error("❌ [SSE] Erro ao criar EventSource:", error)
      onError("Erro ao criar conexão")
    }
  }, [paymentId, enabled, onSuccess, onError, disconnect])

  // Cleanup apenas ao desmontar
  useEffect(() => {
    isMountedRef.current = true

    return () => {
      console.log("🔄 [SSE] Componente desmontando, limpando conexões")
      isMountedRef.current = false

      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, []) // Sem dependências para evitar loops

  return {
    isConnected,
    currentStatus,
    connect,
    disconnect,
  }
}

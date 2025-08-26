import { useState, useEffect, useCallback, useRef } from "react"
import type { PaymentStatus } from "../app/types/checkout"

interface UseSimpleSSEProps {
  paymentId: string
  onSuccess: (status: PaymentStatus) => void
  onError: (error: string) => void
}

interface UseSimpleSSEReturn {
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

export function useSimpleSSE({
  paymentId,
  onSuccess,
  onError,
}: UseSimpleSSEProps): UseSimpleSSEReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  const disconnect = useCallback(() => {
    console.log(`🔌 Desconectando SSE`)
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setIsConnected(false)
  }, [])

  const connect = useCallback(() => {
    if (!paymentId) {
      console.log("❌ PaymentId não fornecido")
      return
    }

    if (eventSourceRef.current) {
      console.log("⚠️ Já existe uma conexão, desconectando primeiro")
      disconnect()
    }

    const apiBaseUrl = getApiBaseUrl()
    const sseUrl = `${apiBaseUrl}/api/v1/payment-status/${paymentId}/stream`

    console.log(`🔌 [SimpleSSE] Conectando para ${paymentId}`)
    console.log(`🌐 [SimpleSSE] URL: ${sseUrl}`)

    // Verificar disponibilidade do EventSource
    if (typeof EventSource === "undefined") {
      console.error("❌ EventSource não disponível")
      onError("EventSource não suportado")
      return
    }

    try {
      const eventSource = new EventSource(sseUrl)
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        console.log(`✅ [SimpleSSE] Conectado para ${paymentId}`)
        setIsConnected(true)
      }

      eventSource.onmessage = (event) => {
        console.log(`📨 [SimpleSSE] Mensagem recebida:`, event.data)

        try {
          const data = JSON.parse(event.data)

          // Ignorar heartbeats
          if (data.heartbeat) {
            console.log("💓 Heartbeat recebido")
            return
          }

          // Verificar timeout
          if (data.timeout) {
            console.log("⏰ Timeout do servidor")
            disconnect()
            onError("Timeout da conexão")
            return
          }

          // Verificar erro
          if (data.error) {
            console.log("❌ Erro do servidor:", data.error)
            disconnect()
            onError(data.error)
            return
          }

          // Atualizar status
          if (data.status) {
            setCurrentStatus(data.status)

            if (data.status === "CONFIRMED" || data.status === "RECEIVED") {
              console.log(`🎉 [SimpleSSE] Pagamento confirmado!`)
              disconnect()
              onSuccess(data)
              return
            }
          }
        } catch (parseError) {
          console.error("❌ Erro ao processar mensagem SSE:", parseError)
        }
      }

      eventSource.onerror = (error) => {
        console.error("❌ [SimpleSSE] Erro na conexão:", {
          readyState: eventSource.readyState,
          url: sseUrl,
          error: error,
        })

        setIsConnected(false)

        // Não tentar reconectar automaticamente, deixar para o componente pai
        setTimeout(() => {
          disconnect()
          onError("Erro na conexão SSE")
        }, 100)
      }
    } catch (error) {
      console.error("❌ [SimpleSSE] Erro ao criar EventSource:", error)
      onError("Erro ao criar conexão")
    }
  }, [paymentId, onSuccess, onError, disconnect])

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    isConnected,
    currentStatus,
    connect,
    disconnect,
  }
}

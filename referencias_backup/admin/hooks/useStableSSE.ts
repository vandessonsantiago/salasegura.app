import { useEffect, useRef, useCallback, useState } from "react"
import type { PaymentStatus } from "../app/types/checkout"

interface UseStableSSEProps {
  paymentId: string
  onSuccess: (status: PaymentStatus) => void
  onError: (error: string) => void
  enabled?: boolean
}

interface UseStableSSEReturn {
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

// Map global para rastrear conexões ativas (evita duplicatas)
const activeConnections = new Map<string, EventSource>()

export function useStableSSE({
  paymentId,
  onSuccess,
  onError,
  enabled = true,
}: UseStableSSEProps): UseStableSSEReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<string | null>(null)

  // Refs estáticos para callbacks
  const onSuccessRef = useRef(onSuccess)
  const onErrorRef = useRef(onError)
  const isMountedRef = useRef(true)

  // Sempre manter as refs atualizadas
  onSuccessRef.current = onSuccess
  onErrorRef.current = onError

  const disconnect = useCallback(() => {
    console.log(`🔌 [StableSSE] Desconectando ${paymentId}...`)

    const existingConnection = activeConnections.get(paymentId)
    if (existingConnection) {
      existingConnection.close()
      activeConnections.delete(paymentId)
    }

    setIsConnected(false)
  }, [paymentId])

  const connect = useCallback(() => {
    if (!paymentId || !enabled) {
      console.log("❌ [StableSSE] PaymentId inválido ou SSE desabilitado")
      return
    }

    // Se já existe uma conexão ativa para este paymentId, não criar outra
    if (activeConnections.has(paymentId)) {
      console.log("⚠️ [StableSSE] Conexão já existe para", paymentId)
      setIsConnected(true)
      return
    }

    console.log(`🔌 [StableSSE] Conectando para ${paymentId}`)

    const apiBaseUrl = getApiBaseUrl()
    const sseUrl = `${apiBaseUrl}/api/v1/payment-status/${paymentId}/stream`

    console.log(`🌐 [StableSSE] URL: ${sseUrl}`)

    try {
      const eventSource = new EventSource(sseUrl)
      activeConnections.set(paymentId, eventSource)

      eventSource.onopen = () => {
        if (!isMountedRef.current) return
        console.log(`✅ [StableSSE] Conectado com sucesso`)
        setIsConnected(true)
      }

      eventSource.onmessage = (event) => {
        if (!isMountedRef.current) return

        console.log(`📨 [StableSSE] Mensagem recebida:`, event.data)

        try {
          const data = JSON.parse(event.data)

          if (data.type === "heartbeat") {
            // Manter conexão viva
            return
          }

          if (data.type === "status") {
            setCurrentStatus(data.status)

            if (data.status === "RECEIVED") {
              console.log(`✅ [StableSSE] Pagamento recebido! Finalizando...`)
              onSuccessRef.current({
                id: paymentId,
                status: data.status,
                value: data.value || 0,
                dateCreated: new Date().toISOString(),
              } as PaymentStatus)

              // Desconectar após sucesso
              disconnect()
            } else if (
              data.status === "OVERDUE" ||
              data.status === "CANCELLED"
            ) {
              console.log(`❌ [StableSSE] Pagamento ${data.status}`)
              onErrorRef.current(`Pagamento ${data.status.toLowerCase()}`)
              disconnect()
            }
          }
        } catch (parseError) {
          console.error("❌ [StableSSE] Erro ao processar dados:", parseError)
        }
      }

      eventSource.onerror = (event) => {
        console.error(`❌ [StableSSE] Erro na conexão:`, event)
        console.log(`❌ [StableSSE] ReadyState: ${eventSource.readyState}`)

        setIsConnected(false)

        // Remove da lista de conexões ativas
        if (activeConnections.get(paymentId) === eventSource) {
          activeConnections.delete(paymentId)
        }

        // Apenas chamar onError se foi um erro definitivo
        if (
          eventSource.readyState === EventSource.CLOSED &&
          isMountedRef.current
        ) {
          onErrorRef.current(`Conexão SSE perdida para pagamento ${paymentId}`)
        }
      }
    } catch (error) {
      console.error("❌ [StableSSE] Erro ao criar EventSource:", error)
      onErrorRef.current("Erro ao criar conexão")
    }
  }, [paymentId, enabled, disconnect])

  // Cleanup apenas ao desmontar componente
  useEffect(() => {
    isMountedRef.current = true

    return () => {
      console.log("🔄 [StableSSE] Componente desmontando, limpando conexões")
      isMountedRef.current = false
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

import { useState, useEffect, useCallback, useRef } from "react"
import type { PaymentStatus } from "../app/types/checkout"

interface UsePaymentWebSocketProps {
  paymentId: string
  onSuccess: (status: PaymentStatus) => void
  onError: (error: string) => void
  onTimeout?: () => void
}

interface UsePaymentWebSocketReturn {
  isConnected: boolean
  currentStatus: string | null
  reconnectAttempts: number
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

export function usePaymentWebSocket({
  paymentId,
  onSuccess,
  onError,
  onTimeout,
}: UsePaymentWebSocketProps): UsePaymentWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<string | null>(null)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)

  const eventSourceRef = useRef<EventSource | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)
  const maxReconnectAttempts = 5

  // Função para conectar ao SSE
  const connect = useCallback(() => {
    if (!paymentId || eventSourceRef.current) return

    console.log(`🔌 Conectando ao SSE para pagamento ${paymentId}`)

    // Construir URL completa para o backend
    const apiBaseUrl = getApiBaseUrl()
    const sseUrl = `${apiBaseUrl}/api/v1/payment-status/${paymentId}/stream`

    console.log(`🌐 URL SSE: ${sseUrl}`)
    console.log(
      `🔍 EventSource disponível:`,
      typeof EventSource !== "undefined"
    )
    console.log(`🔍 apiBaseUrl:`, apiBaseUrl)

    let eventSource: EventSource

    try {
      // Verificar se EventSource está disponível
      if (typeof EventSource === "undefined") {
        throw new Error("EventSource não está disponível neste navegador")
      }

      // Criar conexão SSE
      eventSource = new EventSource(sseUrl)
      eventSourceRef.current = eventSource

      console.log(`📊 EventSource criado, readyState:`, eventSource.readyState)
    } catch (error) {
      console.error("❌ Erro ao criar EventSource:", error)
      onError(
        `Erro ao criar conexão SSE: ${error instanceof Error ? error.message : "Erro desconhecido"}`
      )
      return
    } // Evento de conexão aberta
    eventSource.onopen = () => {
      console.log(`✅ SSE conectado para pagamento ${paymentId}`)
      setIsConnected(true)
      setReconnectAttempts(0)
    }

    // Evento de recebimento de dados
    eventSource.onmessage = (event: MessageEvent) => {
      if (!isMountedRef.current) return

      try {
        const data: any = JSON.parse(event.data) // Usar any para permitir heartbeat e timeout
        console.log(`📨 Atualização SSE recebida:`, data)

        // Ignorar heartbeats e timeouts sem ação
        if (data.heartbeat || data.timeout) {
          return
        }

        const paymentData: PaymentStatus = data
        setCurrentStatus(paymentData.status)

        // Verificar se o pagamento foi confirmado
        if (
          paymentData.status === "CONFIRMED" ||
          paymentData.status === "RECEIVED"
        ) {
          console.log(`🎉 Pagamento confirmado via SSE!`)
          disconnect()
          onSuccess(paymentData)
          return
        }

        // Verificar se houve erro
        if (
          paymentData.status === "OVERDUE" ||
          paymentData.status === "REFUNDED"
        ) {
          console.log(
            `❌ Pagamento ${paymentData.status.toLowerCase()} via SSE`
          )
          disconnect()
          onError(`Pagamento ${paymentData.status.toLowerCase()}`)
          return
        }
      } catch (error) {
        console.error("❌ Erro ao processar dados SSE:", error)
      }
    }

    // Evento de erro
    eventSource.onerror = (event: Event) => {
      const errorInfo = {
        readyState: eventSource.readyState,
        url: sseUrl,
        eventType: event.type,
        message: event instanceof ErrorEvent ? event.message : "Unknown error",
        error: event instanceof ErrorEvent ? event.error : null,
      }

      console.error("❌ Erro na conexão SSE:", errorInfo)
      setIsConnected(false)

      // EventSource.CONNECTING = 0, EventSource.OPEN = 1, EventSource.CLOSED = 2
      if (eventSource.readyState === EventSource.CLOSED) {
        console.log("🔒 Conexão SSE foi fechada pelo servidor")

        // Se foi fechado pelo servidor e temos poucas tentativas, reconectar
        if (reconnectAttempts < maxReconnectAttempts && isMountedRef.current) {
          console.log(`🔄 Reconectando após fechamento do servidor...`)
          setReconnectAttempts((prev) => prev + 1)

          setTimeout(() => {
            if (isMountedRef.current) {
              disconnect()
              connect()
            }
          }, 1000) // Reconectar rapidamente
        } else {
          console.log(`❌ Muitas tentativas de reconexão`)
          onError("Conexão SSE foi finalizada")
        }
      } else if (eventSource.readyState === EventSource.CONNECTING) {
        console.log("⏳ SSE ainda tentando conectar...")

        // Aguardar um pouco mais antes de tentar reconectar
        if (reconnectAttempts < maxReconnectAttempts && isMountedRef.current) {
          setReconnectAttempts((prev) => prev + 1)

          setTimeout(() => {
            if (
              isMountedRef.current &&
              eventSource.readyState === EventSource.CONNECTING
            ) {
              console.log(`🔄 Timeout na conexão, tentando novamente...`)
              disconnect()
              connect()
            }
          }, 5000) // Aguardar 5 segundos
        }
      }
    }

    // Timeout de segurança (5 minutos)
    timeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        console.log(`⏰ Timeout SSE para pagamento ${paymentId}`)
        disconnect()
        onTimeout?.()
      }
    }, 300000) // 5 minutos
  }, [paymentId, onSuccess, onError, onTimeout, reconnectAttempts])

  // Função para desconectar
  const disconnect = useCallback(() => {
    console.log(`🔌 Desconectando SSE...`)

    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    setIsConnected(false)
    console.log(`✅ SSE desconectado`)
  }, [])

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      disconnect()
    }
  }, [disconnect])

  return {
    isConnected,
    currentStatus,
    reconnectAttempts,
    connect,
    disconnect,
  }
}

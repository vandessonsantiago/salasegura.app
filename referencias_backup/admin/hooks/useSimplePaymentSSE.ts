import { useState, useRef } from "react"

interface UseBasicSSEProps {
  paymentId: string
  onStatusChange: (status: string) => void
}

interface UseBasicSSEReturn {
  isConnected: boolean
  start: () => void
  stop: () => void
}

/**
 * Hook SSE básico - apenas escuta mudanças de status
 */
export function useBasicSSE({
  paymentId,
  onStatusChange,
}: UseBasicSSEProps): UseBasicSSEReturn {
  const [isConnected, setIsConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)

  const startListening = () => {
    if (eventSourceRef.current) {
      console.log("🔌 [SimpleSSE] Fechando conexão anterior...")
      eventSourceRef.current.close()
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002"
    const url = `${apiUrl}/api/v1/payment-status/${paymentId}/stream`

    console.log(`🔌 [SimpleSSE] Conectando em: ${url}`)

    const eventSource = new EventSource(url)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      console.log("✅ [SimpleSSE] Conectado!")
      setIsConnected(true)
    }

    eventSource.onmessage = (event) => {
      console.log("📨 [SimpleSSE] Dados:", event.data)

      try {
        const data = JSON.parse(event.data)

        if (data.type === "heartbeat") return

        if (data.type === "status") {
          setCurrentStatus(data.status)

          if (data.status === "RECEIVED") {
            console.log("🎉 [SimpleSSE] Pagamento aprovado!")
            onSuccess({
              id: paymentId,
              status: data.status,
              value: data.value || 0,
              dateCreated: new Date().toISOString(),
            } as PaymentStatus)
            stopListening()
          }
        }
      } catch (err) {
        console.error("❌ [SimpleSSE] Erro ao parsear:", err)
      }
    }

    eventSource.onerror = (event) => {
      console.error("❌ [SimpleSSE] Erro:", event)
      setIsConnected(false)
      onError("Conexão SSE falhou")
    }
  }

  const stopListening = () => {
    console.log("🛑 [SimpleSSE] Parando...")

    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    setIsConnected(false)
  }

  return {
    isConnected,
    currentStatus,
    startListening,
    stopListening,
  }
}

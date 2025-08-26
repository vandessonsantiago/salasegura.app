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

  const start = () => {
    // Fechar conexão anterior se existir
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    console.log(`🔌 Conectando SSE para: ${paymentId}`)

    const url = `http://localhost:3002/api/v1/payment-status/${paymentId}/stream`
    const eventSource = new EventSource(url)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      console.log("✅ SSE Conectado!")
      setIsConnected(true)
    }

    eventSource.onmessage = (event) => {
      console.log("📨 SSE Dados:", event.data)

      try {
        const data = JSON.parse(event.data)

        if (data.type === "status") {
          console.log(`📊 Novo status: ${data.status}`)
          onStatusChange(data.status)
        }
      } catch (err) {
        console.error("❌ Erro ao parsear SSE:", err)
      }
    }

    eventSource.onerror = (event) => {
      console.error("❌ Erro SSE:", event)
      setIsConnected(false)
    }
  }

  const stop = () => {
    console.log("🛑 Parando SSE")

    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    setIsConnected(false)
  }

  return {
    isConnected,
    start,
    stop,
  }
}

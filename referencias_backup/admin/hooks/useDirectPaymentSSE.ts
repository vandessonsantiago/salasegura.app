import { useState, useRef } from "react"
import type { PaymentStatus } from "../app/types/checkout"

interface UseDirectPaymentSSEProps {
  paymentId: string
  onPaymentReceived: () => void
  onPaymentFailed: (error: string) => void
}

interface UseDirectPaymentSSEReturn {
  isListening: boolean
  currentStatus: string | null
  startListening: () => void
  stopListening: () => void
}

/**
 * Hook direto para SSE de pagamento - substitui usePaymentTracker
 */
export function useDirectPaymentSSE({
  paymentId,
  onPaymentReceived,
  onPaymentFailed,
}: UseDirectPaymentSSEProps): UseDirectPaymentSSEReturn {
  const [isListening, setIsListening] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const hasConnectedRef = useRef(false)

  const startListening = () => {
    if (!paymentId) {
      console.log("❌ PaymentId inválido")
      return
    }

    // Evitar múltiplas conexões
    if (eventSourceRef.current || hasConnectedRef.current) {
      console.log("⚠️ SSE já foi iniciado para este pagamento")
      return
    }

    console.log(`🔌 Iniciando SSE para pagamento: ${paymentId}`)
    hasConnectedRef.current = true

    const url = `http://localhost:3002/api/v1/payment-status/${paymentId}/stream`
    const eventSource = new EventSource(url)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      console.log("✅ SSE conectado com sucesso")
      setIsListening(true)
    }

    eventSource.onmessage = (event) => {
      console.log("📨 Evento SSE recebido:", event.data)

      try {
        const data = JSON.parse(event.data)

        if (data.type === "status") {
          setCurrentStatus(data.status)
          console.log(`📊 Status atualizado: ${data.status}`)

          if (data.status === "RECEIVED") {
            console.log("🎉 Pagamento aprovado!")
            onPaymentReceived()
            stopListening()
          } else if (data.status === "CANCELLED" || data.status === "OVERDUE") {
            console.log(`❌ Pagamento ${data.status}`)
            onPaymentFailed(`Pagamento ${data.status.toLowerCase()}`)
            stopListening()
          }
        }
      } catch (err) {
        console.error("❌ Erro ao processar evento SSE:", err)
      }
    }

    eventSource.onerror = (event) => {
      console.error("❌ Erro na conexão SSE:", event)
      setIsListening(false)
      // Não chamar onPaymentFailed por erro de conexão, deixar o polling assumir
    }
  }

  const stopListening = () => {
    console.log("🛑 Parando SSE")

    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    setIsListening(false)
    hasConnectedRef.current = false
  }

  return {
    isListening,
    currentStatus,
    startListening,
    stopListening,
  }
}

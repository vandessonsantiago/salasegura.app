"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { toast } from "react-toastify"

interface PaymentUpdate {
  paymentId: string
  status: "pending" | "approved" | "rejected" | "cancelled" | "failed"
  externalReference?: string
  transactionAmount?: number
  statusDetail?: string
  dateApproved?: string
  dateCreated?: string
}

interface UseDirectPaymentSSEOptions {
  paymentId?: string
  onStatusUpdate?: (update: PaymentUpdate) => void
  enabled?: boolean
}

export function useDirectPaymentSSE({
  paymentId,
  onStatusUpdate,
  enabled = true,
}: UseDirectPaymentSSEOptions = {}) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<PaymentUpdate | null>(null)
  const [error, setError] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  const connect = useCallback(() => {
    if (!paymentId || !enabled) return

    try {
      console.log("🔄 Conectando ao SSE para pagamento:", paymentId)
      
      const eventSource = new EventSource(
        `/api/v1/checkout/payment-status/${paymentId}/stream`
      )
      
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        console.log("✅ Conexão SSE estabelecida")
        setIsConnected(true)
        setError(null)
      }

      eventSource.onmessage = (event) => {
        try {
          const update: PaymentUpdate = JSON.parse(event.data)
          console.log("📦 Atualização de pagamento recebida:", update)
          
          setLastUpdate(update)
          
          if (onStatusUpdate) {
            onStatusUpdate(update)
          }

          // Mostrar toast baseado no status
          switch (update.status) {
            case "approved":
              toast.success("Pagamento aprovado! ✅")
              break
            case "rejected":
              toast.error("Pagamento rejeitado. ❌")
              break
            case "cancelled":
              toast.warning("Pagamento cancelado.")
              break
            case "failed":
              toast.error("Falha no pagamento.")
              break
            case "pending":
              toast.info("Pagamento pendente...")
              break
          }
        } catch (error) {
          console.error("Erro ao processar mensagem SSE:", error)
        }
      }

      eventSource.onerror = (event) => {
        console.error("Erro na conexão SSE:", event)
        setError("Erro na conexão com servidor")
        setIsConnected(false)
      }

    } catch (error) {
      console.error("Erro ao conectar SSE:", error)
      setError("Falha ao conectar com servidor")
    }
  }, [paymentId, enabled, onStatusUpdate])

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      console.log("🔌 Desconectando SSE")
      eventSourceRef.current.close()
      eventSourceRef.current = null
      setIsConnected(false)
    }
  }, [])

  const reconnect = useCallback(() => {
    disconnect()
    setTimeout(connect, 1000)
  }, [disconnect, connect])

  // Auto-conectar quando paymentId estiver disponível
  useEffect(() => {
    if (paymentId && enabled) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [paymentId, enabled, connect, disconnect])

  return {
    isConnected,
    lastUpdate,
    error,
    connect,
    disconnect,
    reconnect,
  }
}

"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import type { ReactNode } from "react"
import { authJsonFetch } from "../lib/api"
import { useAuth } from "./AuthContext"

export interface DivorceCase {
  id: string
  userId: string
  type: string
  status: "pending_payment" | "payment_confirmed" | "in_progress" | "completed" | "cancelled" | "expired"
  paymentId?: string
  valor: number
  createdAt: string
  updatedAt: string
  expiresAt?: string
  qrCodePix?: string
  copyPastePix?: string
  pixExpiresAt?: string
}

interface DivorceContextType {
  divorceCases: DivorceCase[]
  loading: boolean
  currentCase: DivorceCase | null
  hasActiveCase: boolean
  createCase: () => Promise<DivorceCase | null>
  createCaseWithPayment: (paymentData: {
    paymentId: string
    qrCodePix: string
    copyPastePix: string
    pixExpiresAt: string
  }) => Promise<DivorceCase | null>
  updateCaseStatus: (id: string, status: DivorceCase["status"]) => Promise<void>
  updatePaymentInfo: (id: string, paymentData: {
    paymentId: string
    qrCodePix: string
    copyPastePix: string
    pixExpiresAt: string
  }) => Promise<void>
  refresh: () => Promise<void>
  getLatestCase: () => DivorceCase | null
  formatStatus: (status: DivorceCase["status"]) => {
    text: string
    variant: 'pending' | 'confirmed' | 'cancelled' | 'expired'
  }
}

const DivorceContext = createContext<DivorceContextType | undefined>(
  undefined
)

export function DivorceProvider({ children }: { children: ReactNode }) {
  const [divorceCases, setDivorceCases] = useState<DivorceCase[]>([])
  const [loading, setLoading] = useState(true)
  const { user, session } = useAuth()

  // Carregar casos de divórcio do backend
  const loadCasesFromBackend = useCallback(async () => {
    try {
      setLoading(true)

      if (session?.access_token) {
        console.log("📡 Buscando casos de divórcio do backend...")
        const result = await authJsonFetch(
          "/divorcio/cases",
          session.access_token,
          { method: 'GET' }
        )

        if (result && result.success && result.data) {
          const cases: DivorceCase[] = result.data.map((case_: any) => ({
            id: case_.id,
            userId: case_.user_id,
            type: case_.type,
            status: case_.status === 'payment_received' ? 'payment_confirmed' : case_.status, // 🔧 CORREÇÃO: Mapear payment_received para payment_confirmed
            paymentId: case_.payment_id,
            valor: parseFloat(case_.valor),
            createdAt: case_.created_at,
            updatedAt: case_.updated_at,
            expiresAt: case_.expires_at,
            qrCodePix: case_.qr_code_pix,
            copyPastePix: case_.copy_paste_pix,
            pixExpiresAt: case_.pix_expires_at,
          }))

          setDivorceCases(cases)
          console.log("✅ Casos de divórcio carregados:", cases)
          console.log("🔍 Debug - hasActiveCase:", hasActiveCase, "currentCase:", currentCase?.status)
        }
      }
    } catch (error) {
      console.error("❌ Erro ao carregar casos de divórcio:", error)
    } finally {
      setLoading(false)
    }
  }, [session?.access_token])

  // Criar novo caso de divórcio
  const createCase = useCallback(async (): Promise<DivorceCase | null> => {
    try {
      if (!session?.access_token) {
        console.error("❌ Usuário não autenticado")
        return null
      }

      console.log("📡 Criando novo caso de divórcio...")
      const result = await authJsonFetch(
        "/divorcio/iniciar",
        session.access_token,
        {
          method: 'POST',
          body: JSON.stringify({
            type: 'traditional'  // Temporariamente usando 'traditional' para contornar constraint
          })
        }
      )

      if (result && result.success && result.data) {
        const newCase: DivorceCase = {
          id: result.data.caseId,
          userId: user?.id || '',
          type: 'traditional',  // Atualizado para corresponder ao enviado
          status: 'pending_payment',
          valor: 759.00,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        setDivorceCases(prev => [newCase, ...prev])
        console.log("✅ Caso de divórcio criado:", newCase)
        return newCase
      }

      return null
    } catch (error) {
      console.error("❌ Erro ao criar caso de divórcio:", error)
      return null
    }
  }, [session?.access_token, user?.id])

  // Criar novo caso de divórcio com dados de pagamento completos
  const createCaseWithPayment = useCallback(async (paymentData: {
    paymentId: string
    qrCodePix: string
    copyPastePix: string
    pixExpiresAt: string
  }): Promise<DivorceCase | null> => {
    try {
      if (!session?.access_token) {
        console.error("❌ Usuário não autenticado")
        return null
      }

      console.log("📡 Criando novo caso de divórcio com dados de pagamento...")
      const result = await authJsonFetch(
        "/divorcio/iniciar-com-pagamento",
        session.access_token,
        {
          method: 'POST',
          body: JSON.stringify({
            type: 'express',
            paymentId: paymentData.paymentId,
            qrCodePix: paymentData.qrCodePix,
            copyPastePix: paymentData.copyPastePix,
            pixExpiresAt: paymentData.pixExpiresAt
          })
        }
      )

      if (result && result.success && result.data) {
        const newCase: DivorceCase = {
          id: result.data.caseId,
          userId: user?.id || '',
          type: 'express',
          status: 'pending_payment',
          paymentId: paymentData.paymentId,
          qrCodePix: paymentData.qrCodePix,
          copyPastePix: paymentData.copyPastePix,
          pixExpiresAt: paymentData.pixExpiresAt,
          valor: 759.00,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        setDivorceCases(prev => [newCase, ...prev])
        console.log("✅ Caso de divórcio criado com pagamento:", newCase)
        return newCase
      }

      return null
    } catch (error) {
      console.error("❌ Erro ao criar caso de divórcio com pagamento:", error)
      return null
    }
  }, [session?.access_token, user?.id])

  // Atualizar status do caso
  const updateCaseStatus = useCallback(async (id: string, status: DivorceCase["status"]) => {
    try {
      if (!session?.access_token) return

      const result = await authJsonFetch(
        `/divorcio/${id}/status`,
        session.access_token,
        {
          method: 'PATCH',
          body: JSON.stringify({ status })
        }
      )

      if (result && result.success) {
        setDivorceCases(prev =>
          prev.map(case_ =>
            case_.id === id
              ? { ...case_, status, updatedAt: new Date().toISOString() }
              : case_
          )
        )
        console.log("✅ Status do caso atualizado:", id, status)
      }
    } catch (error) {
      console.error("❌ Erro ao atualizar status do caso:", error)
    }
  }, [session?.access_token])

  // Atualizar informações de pagamento
  const updatePaymentInfo = useCallback(async (id: string, paymentData: {
    paymentId: string
    qrCodePix: string
    copyPastePix: string
    pixExpiresAt: string
  }) => {
    try {
      if (!session?.access_token) return

      const result = await authJsonFetch(
        `/divorcio/${id}/pagamento`,
        session.access_token,
        {
          method: 'PATCH',
          body: JSON.stringify({
            paymentId: paymentData.paymentId,
            qrCodePix: paymentData.qrCodePix,
            copyPastePix: paymentData.copyPastePix,
            pixExpiresAt: paymentData.pixExpiresAt
          })
        }
      )

      if (result && result.success) {
        setDivorceCases(prev =>
          prev.map(case_ =>
            case_.id === id
              ? {
                  ...case_,
                  paymentId: paymentData.paymentId,
                  qrCodePix: paymentData.qrCodePix,
                  copyPastePix: paymentData.copyPastePix,
                  pixExpiresAt: paymentData.pixExpiresAt,
                  updatedAt: new Date().toISOString()
                }
              : case_
          )
        )
        console.log("✅ Informações de pagamento atualizadas:", id)
      }
    } catch (error) {
      console.error("❌ Erro ao atualizar informações de pagamento:", error)
    }
  }, [])

  // Refresh dos dados
  const refresh = useCallback(async () => {
    await loadCasesFromBackend()
  }, [loadCasesFromBackend])

  // Obter último caso
  const getLatestCase = useCallback(() => {
    return divorceCases.length > 0 ? divorceCases[0] : null
  }, [divorceCases])

  // Formatar status
  const formatStatus = useCallback((status: DivorceCase["status"]) => {
    switch (status) {
      case 'pending_payment':
        return { text: 'Pagamento Pendente', variant: 'pending' as const }
      case 'payment_confirmed':
        return { text: 'Pagamento Confirmado', variant: 'confirmed' as const }
      case 'in_progress':
        return { text: 'Em Andamento', variant: 'confirmed' as const }
      case 'completed':
        return { text: 'Concluído', variant: 'confirmed' as const }
      case 'cancelled':
        return { text: 'Cancelado', variant: 'cancelled' as const }
      case 'expired':
        return { text: 'Expirado', variant: 'expired' as const }
      default:
        return { text: 'Desconhecido', variant: 'expired' as const }
    }
  }, [])

  // Verificar se há caso ativo
  const hasActiveCase = divorceCases.some(case_ =>
    ['pending_payment', 'payment_confirmed', 'in_progress', 'payment_received'].includes(case_.status)
  )

  // Obter caso atual (mais recente ativo)
  const currentCase = divorceCases.find(case_ =>
    ['pending_payment', 'payment_confirmed', 'in_progress', 'payment_received'].includes(case_.status)
  ) || null

  // Carregar dados na inicialização
  useEffect(() => {
    if (user && session?.access_token) {
      loadCasesFromBackend()
    } else {
      setLoading(false)
    }
  }, [user, session?.access_token, loadCasesFromBackend])

  // 🔧 CORREÇÃO: Refresh automático a cada 30 segundos quando há casos ativos
  useEffect(() => {
    if (hasActiveCase && session?.access_token) {
      const interval = setInterval(() => {
        console.log("🔄 Refresh automático dos casos de divórcio...")
        loadCasesFromBackend()
      }, 30000) // 30 segundos

      return () => clearInterval(interval)
    }
  }, [hasActiveCase, session?.access_token, loadCasesFromBackend])

  const value: DivorceContextType = {
    divorceCases,
    loading,
    currentCase,
    hasActiveCase,
    createCase,
    createCaseWithPayment,
    updateCaseStatus,
    updatePaymentInfo,
    refresh,
    getLatestCase,
    formatStatus,
  }

  return (
    <DivorceContext.Provider value={value}>
      {children}
    </DivorceContext.Provider>
  )
}

export function useDivorce() {
  const context = useContext(DivorceContext)
  if (context === undefined) {
    throw new Error('useDivorce must be used within a DivorceProvider')
  }
  return context
}

"use client"

// biome-ignore assist/source/organizeImports: // biome-ignore
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import type { ReactNode } from "react"
import { api, authJsonFetch } from "../lib/api"
import { useAuth } from "./AuthContext"

export interface ConsultaAgendada {
  id: string
  data: string
  horario: string
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "EXPIRED"
  paymentId: string
  paymentStatus:
    | "PENDING"
    | "CONFIRMED"
    | "CANCELLED"
    | "EXPIRED"
    | "OVERDUE"
    | "REFUNDED"
  valor: number
  descricao: string
  cliente: {
    nome: string
    email: string
    telefone: string
  }
  createdAt: string
  qrCodePix?: string
  copyPastePix?: string
  pixExpiresAt?: string
  calendarEventId?: string
  googleMeetLink?: string
}

interface AgendamentosContextType {
  consultasAgendadas: ConsultaAgendada[]
  loading: boolean
  addConsulta: (consulta: ConsultaAgendada) => Promise<ConsultaAgendada | void>
  updateConsulta: (id: string, updates: Partial<ConsultaAgendada>) => void
  removeConsulta: (id: string) => void
  hasConsultas: boolean
  updatePaymentStatusByPaymentId: (
    paymentId: string,
    status: ConsultaAgendada["paymentStatus"]
  ) => void
  refresh: () => Promise<void>
  getLatestConsulta: () => ConsultaAgendada | null
  formatStatus: (status: ConsultaAgendada["status"]) => {
    text: string
    variant: 'pending' | 'confirmed' | 'cancelled' | 'expired'
  }
  formatDate: (dateStr: string) => string
}

const AgendamentosContext = createContext<AgendamentosContextType | undefined>(
  undefined
)

export function AgendamentosProvider({ children }: { children: ReactNode }) {
  const [consultasAgendadas, setConsultasAgendadas] = useState<
    ConsultaAgendada[]
  >([])
  const [loading, setLoading] = useState(true)
  const { user, session } = useAuth()

  // Carregar consultas do Supabase
  const loadConsultasFromStorage = useCallback(async () => {
    try {
      setLoading(true)

      // Buscar do backend Supabase se usuário está logado
      if (session?.access_token) {
        console.log("📡 Buscando agendamentos do backend...")
        try {
          const result = await authJsonFetch(
            "/agendamentos",
            session.access_token,
            { method: 'GET' }
          )
          console.log("📥 Resposta do backend:", result)
          if (result && result.success && result.data) {
            // Converter formato do backend para o frontend
            type BackendConsulta = {
              id: string
              data: string
              horario: string
              status: ConsultaAgendada["status"]
              payment_id: string
              payment_status: ConsultaAgendada["paymentStatus"]
              valor: string | number
              descricao: string
              cliente_nome: string
              cliente_email: string
              cliente_telefone: string
              created_at: string
              qr_code_pix?: string
              copy_paste_pix?: string
              pix_expires_at?: string
              calendar_event_id?: string
              google_meet_link?: string
            }

            const consultasConvertidas = (result.data as BackendConsulta[]).map(
              (item) => ({
                id: item.id,
                data: item.data,
                horario: item.horario,
                status: item.status,
                paymentId: item.payment_id,
                paymentStatus: item.payment_status,
                valor: parseFloat(String(item.valor)),
                descricao: item.descricao,
                cliente: {
                  nome: item.cliente_nome,
                  email: item.cliente_email,
                  telefone: item.cliente_telefone,
                },
                createdAt: item.created_at,
                qrCodePix: item.qr_code_pix,
                copyPastePix: item.copy_paste_pix,
                pixExpiresAt: item.pix_expires_at,
                calendarEventId: item.calendar_event_id,
                googleMeetLink: item.google_meet_link,
              })
            )

            console.log("✅ Agendamentos carregados do banco:", consultasConvertidas.length)
            setConsultasAgendadas(consultasConvertidas)
            return
          }
        } catch (backendError) {
          console.error("❌ Erro ao buscar do backend:", backendError)
        }
      } else {
        console.log("❌ Usuário não logado ou sem token")
      }

      // Fallback para localStorage se backend falhar
      console.log("📦 Tentando carregar do localStorage...")
      const stored = localStorage.getItem("consultasAgendadas")
      if (stored) {
        const consultasLocal = JSON.parse(stored)
        setConsultasAgendadas(consultasLocal)
        console.log("📦 Carregado do localStorage:", consultasLocal.length, "agendamentos")
      } else {
        setConsultasAgendadas([])
        console.log("📦 Nenhum agendamento encontrado")
      }
    } catch (error) {
      console.error("💥 Erro geral ao carregar consultas:", error)
      setConsultasAgendadas([])
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    loadConsultasFromStorage()
  }, [loadConsultasFromStorage])

  const saveConsultasToStorage = (consultas: ConsultaAgendada[]) => {
    try {
      localStorage.setItem("consultasAgendadas", JSON.stringify(consultas))
    } catch (error) {
      console.error("Erro ao salvar consultas no localStorage:", error)
    }
  }

  const addConsulta = async (consulta: ConsultaAgendada) => {
    try {
      // Converter formato do frontend para o backend
      type WithAlias = ConsultaAgendada & { eventId?: string; meetLink?: string }
      const c = consulta as WithAlias
      const consultaBackend = {
        data: consulta.data,
        horario: consulta.horario,
        status: consulta.status,
        payment_id: consulta.paymentId,
        payment_status: consulta.paymentStatus,
        valor: consulta.valor,
        descricao: consulta.descricao,
        cliente_nome: consulta.cliente.nome,
        cliente_email: consulta.cliente.email,
        cliente_telefone: consulta.cliente.telefone,
        qr_code_pix: consulta.qrCodePix,
        copy_paste_pix: consulta.copyPastePix,
        pix_expires_at: consulta.pixExpiresAt,
        calendar_event_id: consulta.calendarEventId ?? c.eventId,
        google_meet_link: consulta.googleMeetLink ?? c.meetLink,
      }

      // Salvar no backend Supabase quando houver sessão
      if (session?.access_token) {
        const result = await authJsonFetch("/agendamentos", session.access_token, {
          method: "POST",
          body: JSON.stringify(consultaBackend),
        })

        if (result && result.success && result.data && result.data.id) {
          const novaConsulta: ConsultaAgendada = {
            id: result.data.id,
            data: result.data.data,
            horario: result.data.horario,
            status: result.data.status,
            paymentId: result.data.payment_id,
            paymentStatus: result.data.payment_status,
            valor: parseFloat(String(result.data.valor)),
            descricao: result.data.descricao,
            cliente: {
              nome: result.data.cliente_nome,
              email: result.data.cliente_email,
              telefone: result.data.cliente_telefone,
            },
            createdAt: result.data.created_at,
            qrCodePix: result.data.qr_code_pix,
            copyPastePix: result.data.copy_paste_pix,
            pixExpiresAt: result.data.pix_expires_at,
            calendarEventId: result.data.calendar_event_id,
            googleMeetLink: result.data.google_meet_link,
          }

          const updatedConsultas = [...consultasAgendadas, novaConsulta]
          setConsultasAgendadas(updatedConsultas)
          saveConsultasToStorage(updatedConsultas)
          return novaConsulta
        }

        throw new Error("Backend não retornou o id do agendamento criado.")
      }

      // Fallback para localStorage se não houver sessão
      const updatedConsultas = [...consultasAgendadas, consulta]
      setConsultasAgendadas(updatedConsultas)
      saveConsultasToStorage(updatedConsultas)
      return consulta
    } catch (error) {
      console.error("Erro ao adicionar consulta:", error)
      throw error
    }
  }

  const updateConsulta = (id: string, updates: Partial<ConsultaAgendada>) => {
    setConsultasAgendadas((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
      saveConsultasToStorage(updated)
      return updated
    })
  }

  const removeConsulta = (id: string) => {
    setConsultasAgendadas((prev) => {
      const updated = prev.filter((c) => c.id !== id)
      saveConsultasToStorage(updated)
      return updated
    })
  }

  const hasConsultas = consultasAgendadas.length > 0

  const updatePaymentStatusByPaymentId = (
    paymentId: string,
    status: ConsultaAgendada["paymentStatus"]
  ) => {
    setConsultasAgendadas((prev) => {
      const updated = prev.map((c) =>
        c.paymentId === paymentId
          ? {
              ...c,
              paymentStatus: status,
              status: status === "CONFIRMED" ? "CONFIRMED" : c.status,
            }
          : c
      )
      saveConsultasToStorage(updated)
      return updated
    })
  }

  const refresh = async () => {
    await loadConsultasFromStorage()
  }

  const getLatestConsulta = (): ConsultaAgendada | null => {
    if (consultasAgendadas.length === 0) return null
    
    // Retorna a consulta mais recente (por data de criação)
    return consultasAgendadas.reduce((latest, current) => {
      return new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
    })
  }

  const formatStatus = (status: ConsultaAgendada["status"]) => {
    switch (status) {
      case 'PENDING':
        return { text: 'AGUARDANDO', variant: 'pending' as const }
      case 'CONFIRMED':
        return { text: 'CONFIRMADO', variant: 'confirmed' as const }
      case 'CANCELLED':
        return { text: 'CANCELADO', variant: 'cancelled' as const }
      case 'EXPIRED':
        return { text: 'EXPIRADO', variant: 'expired' as const }
      default:
        return { text: 'INDEFINIDO', variant: 'expired' as const }
    }
  }

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-')
    const date = new Date(Number(year), Number(month) - 1, Number(day))
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <AgendamentosContext.Provider
      value={{
        consultasAgendadas,
        loading,
        addConsulta,
        updateConsulta,
        removeConsulta,
        updatePaymentStatusByPaymentId,
        refresh,
        hasConsultas,
        getLatestConsulta,
        formatStatus,
        formatDate,
      }}
    >
      {children}
    </AgendamentosContext.Provider>
  )
}

export function useAgendamentos() {
  const context = useContext(AgendamentosContext)
  if (!context) {
    throw new Error("useAgendamentos must be used within AgendamentosProvider")
  }
  return context
}

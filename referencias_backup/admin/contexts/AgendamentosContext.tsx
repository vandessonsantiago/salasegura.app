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
import { api } from "../lib/api"
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
  addConsulta: (consulta: ConsultaAgendada) => Promise<void>
  updateConsulta: (id: string, updates: Partial<ConsultaAgendada>) => void
  removeConsulta: (id: string) => void
  hasConsultas: boolean
  updatePaymentStatusByPaymentId: (
    paymentId: string,
    status: ConsultaAgendada["paymentStatus"]
  ) => void
  refresh: () => Promise<void>
}

const AgendamentosContext = createContext<AgendamentosContextType | undefined>(
  undefined
)

export function AgendamentosProvider({ children }: { children: ReactNode }) {
  const [consultasAgendadas, setConsultasAgendadas] = useState<
    ConsultaAgendada[]
  >([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  // Carregar consultas do Supabase
  const loadConsultasFromStorage = useCallback(async () => {
    try {
      setLoading(true)

      // Buscar do backend Supabase
      if (user?.access_token) {
        console.log("📡 Buscando agendamentos do backend...")
        const result = await api.fetchWithAuth(
          "/api/v1/agendamentos",
          user.access_token
        )
        console.log("📥 Resposta do backend:", 200)
        if (result) {
          console.log("📋 Dados recebidos:", result)
          if (result.success && result.data) {
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

            console.log(
              "✅ Agendamentos carregados do banco:",
              consultasConvertidas
            )
            setConsultasAgendadas(consultasConvertidas)
            return
          }
        } else {
          console.error(
            "❌ Erro ao buscar agendamentos: resposta vazia ou inválida"
          )
        }
      }

      // Fallback para localStorage se backend falhar
      const stored = localStorage.getItem("consultasAgendadas")
      if (stored) {
        const consultas = JSON.parse(stored)
        setConsultasAgendadas(consultas)
      }
    } catch (error) {
      console.error("Erro ao carregar consultas:", error)
      // Fallback para localStorage
      const stored = localStorage.getItem("consultasAgendadas")
      if (stored) {
        const consultas = JSON.parse(stored)
        setConsultasAgendadas(consultas)
      }
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      console.log(
        "🔄 Carregando agendamentos do banco para usuário:",
        user.email
      )
      void loadConsultasFromStorage()
    }
  }, [user, loadConsultasFromStorage])

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
      type WithAlias = ConsultaAgendada & {
        eventId?: string
        meetLink?: string
      }
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
        // Map calendar event id and google meet link if provided by the frontend
        calendar_event_id: consulta.calendarEventId ?? c.eventId,
        google_meet_link: consulta.googleMeetLink ?? c.meetLink,
      }

      // Salvar no backend Supabase
      if (user?.access_token) {
        const result = await api.fetchWithAuth(
          "/api/v1/agendamentos",
          user.access_token,
          {
            method: "POST",
            body: JSON.stringify(consultaBackend),
          }
        )

        if (result) {
          if (result.success && result.data) {
            // Converter resposta do backend para o formato do frontend
            const novaConsulta: ConsultaAgendada = {
              id: result.data.id,
              data: result.data.data,
              horario: result.data.horario,
              status: result.data.status,
              paymentId: result.data.payment_id,
              paymentStatus: result.data.payment_status,
              valor: parseFloat(result.data.valor),
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
            return
          }
        }
      }

      // Fallback para localStorage se backend falhar
      const updatedConsultas = [...consultasAgendadas, consulta]
      setConsultasAgendadas(updatedConsultas)
      saveConsultasToStorage(updatedConsultas)
    } catch (error) {
      console.error("Erro ao adicionar consulta:", error)
      // Fallback para localStorage
      const updatedConsultas = [...consultasAgendadas, consulta]
      setConsultasAgendadas(updatedConsultas)
      saveConsultasToStorage(updatedConsultas)
    }
  }

  const updateConsulta = (id: string, updates: Partial<ConsultaAgendada>) => {
    const updatedConsultas = consultasAgendadas.map((consulta) =>
      consulta.id === id ? { ...consulta, ...updates } : consulta
    )
    setConsultasAgendadas(updatedConsultas)
    saveConsultasToStorage(updatedConsultas)
  }

  const removeConsulta = (id: string) => {
    const updatedConsultas = consultasAgendadas.filter(
      (consulta) => consulta.id !== id
    )
    setConsultasAgendadas(updatedConsultas)
    saveConsultasToStorage(updatedConsultas)
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

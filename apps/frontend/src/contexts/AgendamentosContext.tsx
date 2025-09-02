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
  paymentId: string | undefined
  paymentStatus:
    | "PENDING"
    | "RECEIVED"
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
  calendar_event_id?: string
  googleMeetLink?: string
}

interface AgendamentosContextType {
  consultasAgendadas: ConsultaAgendada[]
  loading: boolean
  addConsulta: (consulta: ConsultaAgendada) => Promise<ConsultaAgendada | void>
  updateConsulta: (id: string, updates: Partial<ConsultaAgendada>) => void
  removeConsulta: (id: string) => Promise<void>
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
    description: string
    icon: string
    color: string
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
      console.log("🔄 [LOAD] Iniciando carregamento de agendamentos...")

      // Buscar do backend Supabase se usuário está logado
      if (session?.access_token) {
        console.log("📡 [LOAD] Buscando agendamentos do backend...")
        try {
          const result = await authJsonFetch(
            "/agendamentos/user/meu-agendamento",
            session.access_token,
            { method: 'GET' }
          )
          console.log("📥 [LOAD] Resposta bruta do backend:", result)

          if (result && result.success && result.data) {
            console.log(`📊 [LOAD] Agendamento encontrado no backend`)

            // Verificar se result.data é um array ou um único objeto
            const dataArray = Array.isArray(result.data) ? result.data : [result.data];
            console.log(`📊 [LOAD] ${dataArray.length} agendamentos encontrados no backend`)

            // Verificar dados PIX do primeiro item
            if (dataArray.length > 0) {
              const firstItem = dataArray[0]
              console.log("🔍 [LOAD] Primeiro item - dados PIX:", {
                id: firstItem.id,
                qr_code_pix: firstItem.qr_code_pix ? "PRESENTE" : "AUSENTE",
                copy_paste_pix: firstItem.copy_paste_pix ? "PRESENTE" : "AUSENTE",
                pix_expires_at: firstItem.pix_expires_at,
                status: firstItem.status,
                payment_status: firstItem.payment_status
              })
            }
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
              google_meet_link?: string  // Fix: Backend sends snake_case
            }

            const consultasConvertidas = (dataArray as BackendConsulta[]).map(
              (item) => {
                // Mapeamento de status do backend para o frontend
                const mapBackendStatus = (backendStatus: string, paymentStatus: string): ConsultaAgendada["status"] => {
                  // Se o payment_status indicar pagamento concluído, o agendamento deve ser CONFIRMED
                  const completedStatuses = ['RECEIVED', 'CONFIRMED', 'PAID', 'COMPLETED', 'APPROVED'];
                  if (paymentStatus && completedStatuses.includes(paymentStatus)) {
                    return "CONFIRMED"
                  }
                  
                  // Normalizar o status do backend para lowercase para comparação
                  const normalizedBackendStatus = backendStatus?.toLowerCase();
                  
                  switch (normalizedBackendStatus) {
                    case "payment_received":
                      return "CONFIRMED"
                    case "confirmed":
                      return "CONFIRMED"
                    case "pending_payment":
                    case "pending":
                      return "PENDING"
                    case "confirmed":
                      return "CONFIRMED"
                    case "cancelled":
                      return "CANCELLED"
                    case "expired":
                      return "EXPIRED"
                    default:
                      console.log('⚠️ Status desconhecido do backend:', backendStatus, 'Payment status:', paymentStatus)
                      // Se paymentStatus for undefined mas backendStatus for confirmed, assumir CONFIRMED
                      if (normalizedBackendStatus === "confirmed") {
                        return "CONFIRMED"
                      }
                      return "PENDING" // fallback
                  }
                }

                const converted = {
                  id: item.id,
                  data: item.data,
                  horario: item.horario,
                  status: mapBackendStatus(item.status, item.payment_status),
                  paymentId: item.payment_id || undefined,
                  paymentStatus: item.payment_status,
                  valor: parseFloat(String(item.valor || 0)),
                  descricao: item.descricao || 'Agendamento para consulta de alinhamento inicial',
                  cliente: {
                    nome: item.cliente_nome || 'Não informado',
                    email: item.cliente_email || '',
                    telefone: item.cliente_telefone || '',
                  },
                  createdAt: item.created_at || new Date().toISOString(),
                  qrCodePix: item.qr_code_pix,
                  copyPastePix: item.copy_paste_pix,
                  pixExpiresAt: item.pix_expires_at,
                  calendar_event_id: item.calendar_event_id,
                  googleMeetLink: item.google_meet_link,
                };

                console.log(`✅ Agendamento ${item.id} convertido com sucesso:`, {
                  status: converted.status,
                  paymentStatus: converted.paymentStatus,
                  googleMeetLink: converted.googleMeetLink ? "PRESENTE" : "AUSENTE",
                  qrCodePix: converted.qrCodePix ? "PRESENTE" : "AUSENTE",
                  copyPastePix: converted.copyPastePix ? "PRESENTE" : "AUSENTE",
                });

                return converted;
              }
            )

            console.log("✅ Agendamentos carregados do banco:", consultasConvertidas.length)
            setConsultasAgendadas(consultasConvertidas)
            return
          }
        } catch (backendError) {
          console.error("❌ Erro ao buscar do backend:", backendError)
          // Se for erro de API não disponível, mostra mensagem mais clara
          if (backendError instanceof Error && backendError.message.includes('API não está disponível')) {
            console.log("🔄 API não disponível, usando localStorage como fallback")
          }
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
        payment_id: consulta.paymentId || null,
        payment_status: consulta.paymentStatus,
        valor: consulta.valor,
        descricao: consulta.descricao,
        cliente_nome: consulta.cliente.nome,
        cliente_email: consulta.cliente.email,
        cliente_telefone: consulta.cliente.telefone,
        qr_code_pix: consulta.qrCodePix,
        copy_paste_pix: consulta.copyPastePix,
        pix_expires_at: consulta.pixExpiresAt,
        calendar_event_id: consulta.calendar_event_id ?? c.eventId,
        google_meet_link: consulta.googleMeetLink ?? c.meetLink,
      }

      // Salvar no backend Supabase quando houver sessão
      if (session?.access_token) {
        try {
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
              paymentId: result.data.payment_id || undefined,
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
              calendar_event_id: result.data.calendar_event_id,
              googleMeetLink: result.data.googleMeetLink,
            }

            const updatedConsultas = [...consultasAgendadas, novaConsulta]
            setConsultasAgendadas(updatedConsultas)
            saveConsultasToStorage(updatedConsultas)
            return novaConsulta
          }

          throw new Error("Backend não retornou o id do agendamento criado.")
        } catch (backendError) {
          console.error("❌ Erro ao salvar no backend:", backendError)
          // Se for erro de API não disponível, continua com localStorage
          if (backendError instanceof Error && backendError.message.includes('API não está disponível')) {
            console.log("🔄 API não disponível, salvando apenas no localStorage")
          } else {
            throw backendError
          }
        }
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

  const removeConsulta = async (id: string) => {
    try {
      console.log(`🗑️ [REMOVE] Removendo agendamento ${id} do backend...`)

      // Fazer chamada para o backend para excluir do banco
      if (session?.access_token) {
        const result = await authJsonFetch(
          `/agendamentos/${id}/cancelar`,
          session.access_token,
          { 
            method: 'POST'
          }
        )

        if (!result || !result.success) {
          console.error('❌ [REMOVE] Erro ao excluir agendamento do backend:', result?.error)
          throw new Error(result?.error || 'Erro ao excluir agendamento')
        }

        console.log('✅ [REMOVE] Agendamento excluído do backend com sucesso')
      }

      // Remover do estado local
      setConsultasAgendadas((prev) => {
        const updated = prev.filter((c) => c.id !== id)
        saveConsultasToStorage(updated)
        return updated
      })

      console.log('✅ [REMOVE] Agendamento removido com sucesso')
    } catch (error) {
      console.error('❌ [REMOVE] Erro ao remover agendamento:', error)
      throw error
    }
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
    console.log("🔄 Fazendo refresh forçado dos agendamentos do banco...")
    try {
      await loadConsultasFromStorage()
      console.log("✅ Refresh concluído - dados atualizados do banco")
    } catch (error) {
      console.error("❌ Erro no refresh:", error)
    }
  }

  const getLatestConsulta = (): ConsultaAgendada | null => {
    if (consultasAgendadas.length === 0) return null
    
    // Retorna a consulta mais recente (por data de criação)
    return consultasAgendadas.reduce((latest, current) => {
      return new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
    })
  }

  const formatStatus = (status: ConsultaAgendada["status"]) => {
    console.log('🔍 [DEBUG] formatStatus chamado com:', {
      status,
      type: typeof status,
      isString: typeof status === 'string',
      length: status?.length,
      upperCase: status?.toUpperCase()
    });

    switch (status) {
      case 'PENDING':
        console.log('✅ [DEBUG] Status identificado como PENDING');
        return { 
          text: 'AGUARDANDO PAGAMENTO', 
          variant: 'pending' as const,
          description: 'Pagamento pendente - prazo de 24h',
          icon: '⏳',
          color: 'yellow'
        }
      case 'CONFIRMED':
        console.log('✅ [DEBUG] Status identificado como CONFIRMED');
        return { 
          text: 'CONFIRMADO', 
          variant: 'confirmed' as const,
          description: 'Consulta confirmada e agendada',
          icon: '✅',
          color: 'green'
        }
      case 'CANCELLED':
        console.log('✅ [DEBUG] Status identificado como CANCELLED');
        return { 
          text: 'CANCELADO', 
          variant: 'cancelled' as const,
          description: 'Agendamento foi cancelado',
          icon: '❌',
          color: 'red'
        }
      case 'EXPIRED':
        console.log('✅ [DEBUG] Status identificado como EXPIRED');
        return { 
          text: 'EXPIRADO', 
          variant: 'expired' as const,
          description: 'Prazo de pagamento expirou',
          icon: '⏰',
          color: 'gray'
        }
      default:
        console.log('❌ [DEBUG] Status NÃO identificado, caindo no default:', {
          status,
          statusType: typeof status
        });
        return { 
          text: 'INDEFINIDO', 
          variant: 'expired' as const,
          description: 'Status desconhecido',
          icon: '❓',
          color: 'gray'
        }
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

  // Função de debug para verificar dados do backend
  const debugBackendData = useCallback(async () => {
    if (!session?.access_token) return

    try {
      console.log("🔍 [DEBUG] Verificando dados diretamente do backend...")
      const result = await authJsonFetch(
        "/agendamentos/user/meu-agendamento",
        session.access_token,
        { method: 'GET' }
      )

      console.log("🔍 [DEBUG] Resposta bruta do backend:", result)
      
      if (result && result.success && result.data) {
        const data = Array.isArray(result.data) ? result.data[0] : result.data
        console.log("🔍 [DEBUG] Dados detalhados do agendamento:", {
          id: data.id,
          status: data.status,
          payment_status: data.payment_status,
          google_meet_link: data.google_meet_link,
          calendar_event_id: data.calendar_event_id,
          google_meet_link_type: typeof data.google_meet_link,
          calendar_event_id_type: typeof data.calendar_event_id,
          allFields: Object.keys(data)
        })
      }
    } catch (error) {
      console.error("❌ [DEBUG] Erro ao buscar dados:", error)
    }
  }, [session?.access_token])

  // Sistema de polling para verificar atualizações de status de pagamento
  useEffect(() => {
    if (!session?.access_token || consultasAgendadas.length === 0) return

    // Verificar apenas agendamentos com status PENDING
    const pendingConsultas = consultasAgendadas.filter(c => c.status === 'PENDING' && c.paymentId)

    if (pendingConsultas.length === 0) return

    console.log(`🔄 [POLLING] Iniciando polling para ${pendingConsultas.length} agendamentos pendentes`)

    const pollInterval = setInterval(async () => {
      try {
        console.log('🔄 [POLLING] Verificando atualizações de status...')

        const result = await authJsonFetch(
          "/agendamentos/user/meu-agendamento",
          session.access_token,
          { method: 'GET' }
        )

        if (result && result.success && result.data) {
          // Verificar se houve mudanças nos status
          let hasChanges = false
          
          // Garantir que result.data seja tratado como array
          const dataArray = Array.isArray(result.data) ? result.data : [result.data]
          
          const updatedConsultas = consultasAgendadas.map(existing => {
            const backendItem = dataArray.find((item: any) => item.id === existing.id)
            if (backendItem) {
              // Verificar se o status mudou
              const currentStatus = existing.status
              const backendStatus = backendItem.status?.toLowerCase()
              const paymentStatus = backendItem.payment_status

              // Mapeamento de status do backend
              const completedStatuses = ['RECEIVED', 'CONFIRMED', 'PAID', 'COMPLETED', 'APPROVED']
              const newStatus = paymentStatus && completedStatuses.includes(paymentStatus) ? 'CONFIRMED' :
                               backendStatus === 'confirmed' ? 'CONFIRMED' :
                               backendStatus === 'payment_received' ? 'CONFIRMED' :
                               backendStatus === 'pending_payment' ? 'PENDING' :
                               backendStatus === 'cancelled' ? 'CANCELLED' :
                               backendStatus === 'expired' ? 'EXPIRED' : 'PENDING'

              if (newStatus !== currentStatus) {
                console.log(`🔄 [POLLING] Status mudou para ${existing.id}: ${currentStatus} -> ${newStatus}`)
                hasChanges = true
                return {
                  ...existing,
                  status: newStatus as ConsultaAgendada["status"],
                  paymentStatus: paymentStatus,
                  qrCodePix: backendItem.qr_code_pix,
                  copyPastePix: backendItem.copy_paste_pix,
                  pixExpiresAt: backendItem.pix_expires_at,
                  googleMeetLink: backendItem.google_meet_link || existing.googleMeetLink,
                }
              }

              // Verificar se os dados PIX foram adicionados
              if (!existing.qrCodePix && backendItem.qr_code_pix) {
                console.log(`🔄 [POLLING] Dados PIX adicionados para ${existing.id}`)
                hasChanges = true
                return {
                  ...existing,
                  qrCodePix: backendItem.qr_code_pix,
                  copyPastePix: backendItem.copy_paste_pix,
                  pixExpiresAt: backendItem.pix_expires_at,
                  googleMeetLink: backendItem.google_meet_link || existing.googleMeetLink,
                }
              }
            }
            return existing
          })

          if (hasChanges) {
            console.log('✅ [POLLING] Atualizações detectadas, recarregando lista completa...')
            await loadConsultasFromStorage() // Recarregar tudo para garantir consistência
          }
        }
      } catch (error) {
        console.error('❌ [POLLING] Erro no polling:', error)
      }
    }, 30000) // Verificar a cada 30 segundos

    return () => {
      console.log('🛑 [POLLING] Parando polling')
      clearInterval(pollInterval)
    }
  }, [consultasAgendadas, session?.access_token, loadConsultasFromStorage])

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

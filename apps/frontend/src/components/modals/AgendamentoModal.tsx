"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { CalendarIcon } from "@phosphor-icons/react"
import {
  useAgendamentos,
  type ConsultaAgendada,
} from "../../contexts/AgendamentosContext"
import { useAuth } from "../../contexts/AuthContext"
import CheckoutComponent from "../payments/CheckoutComponent"
import { apiEndpoint } from "../../lib/api"
import { useAppointmentCheckout } from "@/hooks/useSpecializedCheckout"
import { useToast } from "@/components/ui/ToastProvider"

// Helper para fazer requests para a API
const api = {
  fetch: async (path: string, init?: RequestInit) => {
    try {
      const response = await fetch(apiEndpoint(path), init);
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      // Trata erros de rede/conectividade
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('API não está disponível. Verifique se o servidor está rodando.');
      }
      throw error;
    }
  }
};

interface AgendamentoModalProps {
  isOpen: boolean
  onClose: () => void
  onAgendar: (data: string, horario: string) => void
}

interface TimeSlot {
  id: string
  time: string
  available: boolean
  label: string
}

interface AvailableSlotDetailed {
  // server can return either a simple `time` (HH:mm) or explicit local fields
  time?: string
  startTime?: string
  startDate?: string
  meetLink?: string
  googleMeetLink?: string
  eventId?: string
  calendarEventId?: string
  endTime?: string
  summary?: string
}

interface AvailableSlotsResponse {
  date: string
  availableSlots: string[]
  availableSlotsDetailed?: AvailableSlotDetailed[]
}

interface AvailableDatesResponse {
  period: string
  availableDates: { [date: string]: string[] }
}

export default function AgendamentoModal({
  isOpen,
  onClose,
  onAgendar,
}: AgendamentoModalProps) {
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [currentAgendamentoId, setCurrentAgendamentoId] = useState<string | null>(null)
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [availableSlotsDetailed, setAvailableSlotsDetailed] = useState<
    AvailableSlotDetailed[]
  >([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [availableDates, setAvailableDates] = useState<{
    [date: string]: string[]
  }>({})
  const [loadingDates, setLoadingDates] = useState(false)
  const [clienteTelefone, setClienteTelefone] = useState<string>("")
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error' | 'info'
    message: string
  } | null>(null)

  const { addConsulta } = useAgendamentos()
  const { user } = useAuth()
  const toast = useToast()
  // Atualizar telefone quando mudar - forçar re-render do hook
  const [checkoutKey, setCheckoutKey] = useState(0);
  useEffect(() => {
    if (clienteTelefone && clienteTelefone.trim() !== "") {
      console.log("🎯 [AGENDAMENTO] Telefone mudou, forçando atualização:", clienteTelefone);
      setCheckoutKey(prev => prev + 1);
    }
  }, [clienteTelefone]);

  // ✅ CORREÇÃO: Memoizar initialData para evitar loop infinito no useEffect
  const initialData = useMemo(() => ({
    name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Cliente",
    email: user?.email || "",
    phone: clienteTelefone || "",
  }), [user?.user_metadata?.full_name, user?.email, clienteTelefone]);

  const appointmentCheckout = useAppointmentCheckout(initialData, checkoutKey);

  // 🔧 CORREÇÃO: Criar wrapper para o hook que inclui dados do slot selecionado
  const appointmentCheckoutWithSlotData = {
    ...appointmentCheckout,
    generatePix: async (value: number) => {
      // Incluir dados do slot selecionado no serviceData
      const serviceData = {
        calendarEventId: selectedSlotDetail?.calendarEventId || selectedSlotDetail?.eventId,
        googleMeetLink: selectedSlotDetail?.googleMeetLink || selectedSlotDetail?.meetLink,
      };

      console.log("🎯 [FRONTEND] Gerando PIX com dados do slot selecionado:", {
        calendarEventId: serviceData.calendarEventId,
        googleMeetLink: serviceData.googleMeetLink,
        selectedDate,
        selectedTime,
      });

      return appointmentCheckout.generatePix(value, serviceData, selectedDate, selectedTime);
    }
  };

  // Buscar datas disponíveis nos próximos 15 dias
  const fetchAvailableDates = useCallback(async () => {
    try {
      setLoadingDates(true)
      console.log("🔍 Buscando datas disponíveis nos próximos 15 dias...")

      const response: AvailableDatesResponse = await api.fetch(
        "/available-slots/dates"
      )

      console.log("✅ Datas disponíveis recebidas:", response.availableDates)
      // debug: print the raw date keys to help diagnose timezone/display issues
      console.log("✅ Datas keys:", Object.keys(response.availableDates))
      setAvailableDates(response.availableDates)
    } catch (error) {
      toast.error('Erro ao Carregar Datas', 'Não foi possível carregar as datas disponíveis. Tente novamente.')
      setAvailableDates({})
    } finally {
      setLoadingDates(false)
    }
  }, [])

  // Buscar slots disponíveis quando uma data for selecionada
  const fetchAvailableSlots = useCallback(
    async (date: string) => {
      if (!date) {
        setAvailableSlots([])
        setAvailableSlotsDetailed([])
        return
      }

      setLoadingSlots(true)
      try {
        console.log("🔍 Buscando slots detalhados para data:", date)
        const response: AvailableSlotsResponse = await api.fetch(
          `/available-slots?date=${date}`
        )
        const slotsForDate = response.availableSlots || []
        const slotsDetailed =
          response.availableSlotsDetailed ||
          slotsForDate.map((t) => ({ time: t }))
        console.log("✅ Slots disponíveis (simples):", slotsForDate)
        console.log("✅ Slots disponíveis (detalhados):", slotsDetailed)
        setAvailableSlots(slotsForDate)
        setAvailableSlotsDetailed(slotsDetailed)
      } catch (err) {
        toast.error('Erro ao Carregar Horários', 'Não foi possível carregar os horários disponíveis.')
        // Fallback: usar slots carregados pela busca de 15 dias
        const fallback = availableDates[date] || []
        setAvailableSlots(fallback)
        setAvailableSlotsDetailed(fallback.map((t) => ({ time: t })))
      } finally {
        setLoadingSlots(false)
      }
    },
    [availableDates]
  )

  // Gerar datas disponíveis baseadas no Google Calendar
  const getAvailableDates = () => {
    const dates = []

    // Usar apenas as datas que têm slots disponíveis do Google Calendar
    for (const dateStr of Object.keys(availableDates).sort()) {
      // dateStr is expected to be 'YYYY-MM-DD' from the API; construct UTC date
      // to avoid client timezone shifts when formatting the label
      const parts = dateStr.split("-").map((n) => parseInt(n, 10))
      const y = parts[0] || 1970
      const m = parts[1] || 1
      const d = parts[2] || 1
      // Construct the Date at noon UTC to avoid timezone shifting the day in the user's browser
      const utcDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
      dates.push({
        date: dateStr,
        label: utcDate
          .toLocaleDateString("pt-BR", {
            weekday: "short",
            day: "2-digit",
            month: "2-digit",
          })
          .replace(".", ""),
      })
    }

    return dates
  }

  // Gerar slots de horários baseados nos disponíveis
  const getTimeSlots = (): TimeSlot[] => {
    if (availableSlots.length === 0) {
      return [
        { id: "1", time: "09:00", available: false, label: "09:00 - 09:30" },
        { id: "2", time: "10:00", available: false, label: "10:00 - 10:30" },
        { id: "3", time: "11:00", available: false, label: "11:00 - 11:30" },
        { id: "4", time: "14:00", available: false, label: "14:00 - 14:30" },
        { id: "5", time: "15:00", available: false, label: "15:00 - 15:30" },
        { id: "6", time: "16:00", available: false, label: "16:00 - 16:30" },
      ]
    }

    // Prefer detailed slots when available (to keep meetLink/eventId)
    if (availableSlotsDetailed.length > 0) {
      return availableSlotsDetailed.map((s, index) => {
        const slotTime = s.time || s.startTime || ""
        const slotEnd = s.endTime || addMinutes(slotTime, 30)
        return {
          id: String(index + 1),
          time: slotTime,
          available: Boolean(slotTime),
          label: `${slotTime} - ${slotEnd}`,
        }
      })
    }

    return availableSlots.map((slot, index) => ({
      id: String(index + 1),
      time: slot,
      available: true,
      label: `${slot} - ${addMinutes(slot, 30)}`,
    }))
  }

  // Função auxiliar para adicionar minutos a um horário
  const addMinutes = (time: string, minutes: number): string => {
    const parts = time.split(":").map(Number)
    if (parts.length !== 2) return time

    const hours = parts[0] || 0
    const mins = parts[1] || 0
    const totalMinutes = hours * 60 + mins + minutes
    const newHours = Math.floor(totalMinutes / 60)
    const newMins = totalMinutes % 60
    return `${String(newHours).padStart(2, "0")}:${String(newMins).padStart(2, "0")}`
  }

  // Carregar datas disponíveis quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      fetchAvailableDates()
    }
  }, [isOpen, fetchAvailableDates])

  // Atualizar slots quando data for selecionada
  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(selectedDate)
    }
  }, [selectedDate, fetchAvailableSlots])

  // Limpar feedback message automaticamente após 5 segundos
  useEffect(() => {
    if (feedbackMessage) {
      const timer = setTimeout(() => {
        setFeedbackMessage(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [feedbackMessage])

  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
    setSelectedTime("")
  }

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) {
      setFeedbackMessage({
        type: 'error',
        message: 'Por favor, selecione uma data e horário'
      })
      return
    }

    if (!clienteTelefone.trim()) {
      setFeedbackMessage({
        type: 'error',
        message: 'Por favor, informe seu telefone para contato'
      })
      return
    }

    setLoading(true)
    try {
      // NÃO criar agendamento ainda - primeiro gerar o PIX
      // O agendamento será criado APÓS o processamento do pagamento
      setShowCheckout(true)
    } catch (error) {
      toast.error('Erro no Checkout', 'Erro ao iniciar checkout. Tente novamente.')
      setFeedbackMessage({
        type: 'error',
        message: 'Erro ao iniciar checkout. Tente novamente.'
      })
    } finally {
      setLoading(false)
    }
  }

  // store the selected detailed slot (so we can save eventId/meetLink)
  const [selectedSlotDetail, setSelectedSlotDetail] =
    useState<AvailableSlotDetailed | null>(null)

  const handleCheckoutSuccess = async (
    paymentId: string,
    status: string,
    pixData?: { qrCode?: string; copyPaste?: string; caseId?: string }
  ) => {
    console.log("Pagamento processado:", { paymentId, status, pixData })

    try {
      if (status === 'PENDING') {
        // PIX foi gerado, mas pagamento ainda não foi confirmado
        // Apenas armazenar os dados para uso posterior
        console.log("PIX gerado com sucesso, aguardando confirmação do pagamento")
        return
      }

      if (status === 'CONFIRMED') {
        // Pagamento foi confirmado - AGORA criar o agendamento
        const consultaComPix = {
          id: `temp_${Date.now()}`, // ID temporário, será substituído pelo backend
          data: selectedDate,
          horario: selectedTime,
          status: 'CONFIRMED' as const,
          paymentId: paymentId,
          paymentStatus: 'CONFIRMED' as const,
          valor: 99.0,
          descricao: `Agendamento para ${selectedDate} às ${selectedTime} - Consulta de 45 minutos`,
          cliente: {
            nome: user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Cliente",
            email: user?.email || "",
            telefone: clienteTelefone || "(92) 99999-9999",
          },
          createdAt: new Date().toISOString(),
          qrCodePix: pixData?.qrCode || '',
          copyPastePix: pixData?.copyPaste || '',
          pixExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
          calendarEventId: selectedSlotDetail?.calendarEventId || selectedSlotDetail?.eventId,
          googleMeetLink: selectedSlotDetail?.googleMeetLink || selectedSlotDetail?.meetLink,
        }

        // Salva no backend com dados completos do PIX
        const novaConsulta = await addConsulta(consultaComPix)
        if (!novaConsulta || !novaConsulta.id) {
          setFeedbackMessage({
            type: 'error',
            message: 'Erro ao criar agendamento. Tente novamente.'
          })
          return
        }

        // Armazenar o ID do agendamento criado
        setCurrentAgendamentoId(novaConsulta.id)

        console.log("✅ Agendamento criado com sucesso com dados PIX:", novaConsulta.id)
        setFeedbackMessage({
          type: 'success',
          message: 'Pagamento confirmado! Seu agendamento foi criado com sucesso.'
        })
      }

    } catch (error) {
      toast.error('Erro no Agendamento', 'Erro ao processar agendamento. Tente novamente.')
      setFeedbackMessage({
        type: 'error',
        message: 'Erro ao processar agendamento. Tente novamente.'
      })
    }
  }

  const handleCheckoutError = (error: string) => {
    toast.error('Erro no Pagamento', `Erro no pagamento: ${error}`)
    setFeedbackMessage({
      type: 'error',
      message: `Erro no pagamento: ${error}`
    })
  }

  const handleCheckoutCancel = () => {
    setShowCheckout(false)
    onClose() // FECHA TUDO e volta ao dashboard
  }

  // Buscar slots quando data for selecionada
  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(selectedDate)
      setSelectedTime("") // Resetar horário selecionado
    }
  }, [selectedDate, fetchAvailableSlots])

  // Limpar estados quando o modal for fechado
  useEffect(() => {
    if (!isOpen) {
      setSelectedDate("")
      setSelectedTime("")
      setShowCheckout(false)
      setLoading(false)
      setAvailableSlots([])
    }
  }, [isOpen])

  console.log("🎯 AgendamentoModal renderizando - isOpen:", isOpen)

  if (!isOpen) {
    console.log("🎯 Modal não está aberto, retornando null")
    return null
  }

  // Se mostrar checkout, renderizar componente de checkout
  if (showCheckout) {
    console.log("🎯 Renderizando checkout")
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="max-w-4xl w-full max-h-[95vh] overflow-y-auto flex items-start justify-center">
          <CheckoutComponent
            value={99.0}
            productName="Consulta de Alinhamento Inicial"
            productDescription={`Agendamento para ${selectedDate} às ${selectedTime} - Consulta de 45 minutos`}
            customerId={undefined}
            checkoutHook={appointmentCheckoutWithSlotData}
            onSuccess={handleCheckoutSuccess}
            onError={handleCheckoutError}
            onCancel={handleCheckoutCancel}
            initialCustomerData={{
              name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Cliente",
              email: user?.email || "",
              phone: clienteTelefone || "",
            }}
          />
        </div>
      </div>
    )
  }

  console.log("🎯 Renderizando modal principal")

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[95vh] overflow-hidden shadow-2xl transform transition-all duration-300 scale-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <CalendarIcon size={20} weight="fill" className="text-blue-600" />
                  </div>
                  Agendar Alinhamento Inicial
                </h2>
                <p className="text-gray-600 mt-2">
                  Consulta de 45 minutos - Custo acessível
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl p-3 transition-all duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Feedback Message */}
          {feedbackMessage && (
            <div className={`mx-8 mt-4 p-4 rounded-xl border-l-4 flex items-center gap-3 ${
              feedbackMessage.type === 'success'
                ? 'bg-green-50 border-green-500 text-green-800'
                : feedbackMessage.type === 'error'
                ? 'bg-red-50 border-red-500 text-red-800'
                : 'bg-blue-50 border-blue-500 text-blue-800'
            }`}>
              <div className={`flex-shrink-0 w-5 h-5 ${
                feedbackMessage.type === 'success'
                  ? 'text-green-600'
                  : feedbackMessage.type === 'error'
                  ? 'text-red-600'
                  : 'text-blue-600'
              }`}>
                {feedbackMessage.type === 'success' ? (
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : feedbackMessage.type === 'error' ? (
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <p className="text-sm font-medium">{feedbackMessage.message}</p>
              <button
                onClick={() => setFeedbackMessage(null)}
                className={`ml-auto flex-shrink-0 w-4 h-4 rounded-full hover:bg-black/10 transition-colors ${
                  feedbackMessage.type === 'success'
                    ? 'text-green-600'
                    : feedbackMessage.type === 'error'
                    ? 'text-red-600'
                    : 'text-blue-600'
                }`}
              >
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}

          {/* Content */}
          <div className="overflow-y-auto max-h-[60vh] px-8 py-6">
            {/* Seleção de Data */}
            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CalendarIcon size={20} weight="fill" className="text-blue-600" />
                Escolha uma data:
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {getAvailableDates().map((date) => (
                  <button
                    key={date.date}
                    data-date={date.date}
                    onClick={() => setSelectedDate(date.date || "")}
                    className={`p-4 text-sm rounded-xl border transition-all duration-200 ${
                      selectedDate === date.date
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-500 shadow-lg"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                    }`}
                  >
                    {date.label}
                    <span className="sr-only"> ({date.date})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Seleção de Horário */}
            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12,6 12,12 16,14"></polyline>
                </svg>
                Escolha um horário:
              </h3>
              {loadingSlots ? (
                <div className="text-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                  <p className="text-sm text-gray-600">
                    Carregando horários disponíveis...
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {getTimeSlots().map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => {
                        if (!slot.available) return
                        setSelectedTime(slot.time)
                        // Find the detailed slot by either `time` or `startTime` (server may return either)
                        const detail =
                          availableSlotsDetailed.find(
                            (d) =>
                              d.time === slot.time || d.startTime === slot.time
                          ) || null
                        setSelectedSlotDetail(detail)
                      }}
                      disabled={!slot.available}
                      className={`p-4 text-sm rounded-xl border transition-all duration-200 ${
                        !slot.available
                          ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                          : selectedTime === slot.time
                            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-500 shadow-lg"
                            : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                      }`}
                    >
                      {slot.label}
                      {!slot.available && (
                        <span className="block text-xs mt-1">Ocupado</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Informações de Contato */}
            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Informações de contato:
              </h3>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome: <span className="text-blue-600 font-semibold">{user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Cliente"}</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email: <span className="text-blue-600 font-semibold">{user?.email}</span>
                  </label>
                </div>
                <div>
                  <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="telefone"
                    value={clienteTelefone}
                    onChange={(e) => setClienteTelefone(e.target.value)}
                    placeholder="(92) 99999-9999"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Informações */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 text-blue-600 text-lg">ℹ️</div>
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-3">
                    Sobre o Alinhamento Inicial:
                  </p>
                  <ul className="space-y-2 text-xs leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Duração: 45 minutos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Modalidade: Online (Google Meet)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Custo acessível - Investimento acessível</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Análise personalizada do seu caso</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-8 py-6 border-t border-gray-200">
            <div className="max-w-md mx-auto">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!selectedDate || !selectedTime || loading}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Agendando...
                    </div>
                  ) : (
                    "CONFIRMAR AGENDAMENTO"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

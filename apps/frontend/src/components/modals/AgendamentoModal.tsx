"use client"

import { useState, useEffect, useCallback } from "react"
import { CalendarIcon } from "@phosphor-icons/react"
import { useAgendamentos } from "../../contexts/AgendamentosContext"
import CheckoutComponent from "../payments/CheckoutComponent"
import { apiEndpoint } from "../../lib/api"

// Helper para fazer requests para a API
const api = {
  fetch: async (path: string, init?: RequestInit) => {
    const response = await fetch(apiEndpoint(path), init);
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
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
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [availableSlotsDetailed, setAvailableSlotsDetailed] = useState<
    AvailableSlotDetailed[]
  >([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [availableDates, setAvailableDates] = useState<{
    [date: string]: string[]
  }>({})
  const [loadingDates, setLoadingDates] = useState(false)

  const { addConsulta } = useAgendamentos()

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
      console.error("Erro ao buscar datas disponíveis:", error)
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
        console.error("Erro ao buscar slots detalhados:", err)
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

  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
    setSelectedTime("")
  }

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) {
      alert("Por favor, selecione uma data e horário")
      return
    }

    // Cria o agendamento no backend e só depois inicia o checkout
    const consultaTemp = {
      id: undefined, // será preenchido pelo backend
      data: selectedDate,
      horario: selectedTime,
      status: "PENDING",
      paymentId: "",
      paymentStatus: "PENDING",
      valor: 99.0,
      descricao: `Agendamento para ${selectedDate} às ${selectedTime} - Consulta de 45 minutos`,
      cliente: {
        nome: "Vandesson Santiago",
        email: "vandesson.santiago@outlook.com",
        telefone: "(92) 98409-3014",
      },
      createdAt: new Date().toISOString(),
      qrCodePix: undefined,
      copyPastePix: undefined,
      pixExpiresAt: undefined,
      calendarEventId: selectedSlotDetail?.calendarEventId || selectedSlotDetail?.eventId,
      googleMeetLink: selectedSlotDetail?.googleMeetLink || selectedSlotDetail?.meetLink,
    }

    // Salva no backend e obtém o id real
    const novaConsulta = await addConsulta(consultaTemp)
    if (!novaConsulta || !novaConsulta.id) {
      alert("Erro ao criar agendamento. Tente novamente.")
      return
    }

    // Agora inicia o checkout com o agendamentoId correto
    setShowCheckout(novaConsulta.id)
  }

  // store the selected detailed slot (so we can save eventId/meetLink)
  const [selectedSlotDetail, setSelectedSlotDetail] =
    useState<AvailableSlotDetailed | null>(null)

  const handleCheckoutSuccess = async (
    paymentId: string,
    status: string,
    pixData?: { qrCode?: string; copyPaste?: string }
  ) => {
    console.log("Pagamento realizado:", { paymentId, status, pixData })

    // Criar nova consulta agendada
    const novaConsulta = {
      id: `consulta_${Date.now()}`,
      data: selectedDate,
      horario: selectedTime,
      // prefer canonical names for persistence
      calendarEventId:
        selectedSlotDetail?.calendarEventId || selectedSlotDetail?.eventId,
      googleMeetLink:
        selectedSlotDetail?.googleMeetLink || selectedSlotDetail?.meetLink,
      status: "PENDING" as const,
      paymentId: paymentId,
      paymentStatus: "PENDING" as any,
      valor: 99.0,
      descricao: `Agendamento para ${selectedDate} às ${selectedTime} - Consulta de 45 minutos`,
      cliente: {
        nome: "Vandesson Santiago",
        email: "vandesson.santiago@outlook.com",
        telefone: "(92) 98409-3014",
      },
      createdAt: new Date().toISOString(),
      qrCodePix: pixData?.qrCode,
      copyPastePix: pixData?.copyPaste,
      pixExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
    }

    // ADICIONA à lista consultasAgendadas (persiste no Supabase)
    console.log("💾 Salvando agendamento no banco:", novaConsulta)
    console.log("🔍 Dados PIX para salvar:", {
      qrCodePix: novaConsulta.qrCodePix?.substring(0, 50) + "...",
      copyPastePix: novaConsulta.copyPastePix?.substring(0, 50) + "...",
      pixExpiresAt: novaConsulta.pixExpiresAt,
    })
    await addConsulta(novaConsulta)
    console.log("✅ Agendamento salvo com sucesso!")

    // O checkout vai mostrar countdown de 15s e depois fechar automaticamente
    // Não fechamos aqui - deixamos o CheckoutComponent gerenciar
  }

  const handleCheckoutError = (error: string) => {
    console.error("Erro no checkout:", error)
    alert(`Erro no pagamento: ${error}`)
  }

  const handleCheckoutCancel = () => {
    setShowCheckout(false)
    onClose() // FECHA TUDO e volta ao dashboard
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
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
      <div
        className="fixed inset-0 flex items-center justify-center z-50"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        onClick={handleBackdropClick}
      >
        <div className="max-w-4xl w-full max-h-[95vh] overflow-y-auto flex items-start justify-center p-4">
          <CheckoutComponent
            value={99.0}
            productName="Consulta de Alinhamento Inicial"
            productDescription={`Agendamento para ${selectedDate} às ${selectedTime} - Consulta de 45 minutos`}
            customerId={undefined}
            agendamentoId={showCheckout}
            onSuccess={handleCheckoutSuccess}
            onError={handleCheckoutError}
            onCancel={handleCheckoutCancel}
          />
        </div>
      </div>
    )
  }

  console.log("🎯 Renderizando modal principal")

  return (
    <>
      <div
        className="fixed inset-0 flex items-center justify-center z-50"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="bg-blue-600 text-white px-6 py-4 rounded-t-xl">
            <div>
              <h2 className="text-xl font-semibold leading-tight flex items-center gap-2">
                <CalendarIcon size={24} weight="fill" />
                Agendar Alinhamento Inicial
              </h2>
              <p className="text-blue-100 text-sm mt-1 leading-relaxed">
                Consulta de 45 minutos - Custo acessível
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Seleção de Data */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CalendarIcon size={20} weight="fill" />
                Escolha uma data:
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {getAvailableDates().map((date) => (
                  <button
                    key={date.date}
                    data-date={date.date}
                    onClick={() => setSelectedDate(date.date || "")}
                    className={`p-3 text-sm rounded-lg border transition-colors ${
                      selectedDate === date.date
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {date.label}
                    <span className="sr-only"> ({date.date})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Seleção de Horário */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">
                ⏰ Escolha um horário:
              </h3>
              {loadingSlots ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">
                    Carregando horários disponíveis...
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
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
                      className={`p-3 text-sm rounded-lg border transition-colors ${
                        !slot.available
                          ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                          : selectedTime === slot.time
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {slot.label}
                      {!slot.available && (
                        <span className="block text-xs">Ocupado</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Informações */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 text-blue-600 text-lg">ℹ️</div>
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-2">
                    Sobre o Alinhamento Inicial:
                  </p>
                  <ul className="space-y-1 text-xs leading-relaxed">
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

            {/* Botões de ação */}
            <div className="space-y-3">
              <button
                onClick={handleSubmit}
                disabled={!selectedDate || !selectedTime || loading}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700"
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
    </>
  )
}

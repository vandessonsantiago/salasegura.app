"use client"

import React, { useState, useEffect } from "react"
import { QRCodeSVG } from "qrcode.react"
import {
  CalendarIcon,
  QrCodeIcon,
  CopyIcon,
  CheckIcon,
  PencilSimpleIcon,
  TrashIcon,
  XIcon,
  ClockIcon,
  CreditCardIcon,
  VideoCameraIcon,
  ArrowUpRightIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  CurrencyDollarIcon,
} from "@phosphor-icons/react"
import {
  useAgendamentos,
  type ConsultaAgendada,
} from "../../contexts/AgendamentosContext"
import { useToast } from "@/components/ui/ToastProvider"
import ConfirmDialog from "@/components/ui/ConfirmDialog"

interface MeusAgendamentosModalProps {
  isOpen: boolean
  onClose: () => void
  onAlterarAgendamento: (consulta: ConsultaAgendada) => void
}

export default function MeusAgendamentosModal({
  isOpen,
  onClose,
  onAlterarAgendamento,
}: MeusAgendamentosModalProps) {
  const { consultasAgendadas, removeConsulta, refresh } = useAgendamentos()
  const { success, error } = useToast()
  const [selectedConsulta, setSelectedConsulta] =
    useState<ConsultaAgendada | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error' | 'info'
    message: string
  } | null>(null)

  // Estados para o dialog de confirmação
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'warning'
  });

  // Auto-refresh a cada 30 segundos quando o modal está aberto
  useEffect(() => {
    if (!isOpen) return

    const interval = setInterval(() => {
      console.log("� Auto-refresh: verificando atualizações no banco...")
      handleRefresh()
    }, 30000) // 30 segundos

    return () => clearInterval(interval)
  }, [isOpen])

  // Efeito para refresh inicial quando o modal abre
  useEffect(() => {
    if (isOpen) {
      console.log("🔄 Modal aberto: carregando dados mais recentes do banco...")
      handleRefresh()
    }
  }, [isOpen])

  // Função para refresh com loading state
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refresh()
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return <CheckIcon size={24} className="text-white" weight="fill" />
      case "PENDING":
        return <ClockIcon size={24} className="text-white" weight="fill" />
      default:
        return <CalendarIcon size={24} className="text-white" weight="fill" />
    }
  }

  const handleCancelarConsulta = async (consultaId: string) => {
    const performCancel = async () => {
      try {
        setFeedbackMessage({ type: 'info', message: 'Cancelando agendamento...' })
        await removeConsulta(consultaId)
        success('Agendamento cancelado', 'O agendamento foi cancelado com sucesso.')
        setFeedbackMessage({ type: 'success', message: 'Agendamento cancelado com sucesso!' })

        // Limpar mensagem após 3 segundos
        setTimeout(() => setFeedbackMessage(null), 3000)
      } catch (err) {
        console.error('Erro ao cancelar agendamento:', err)
        error('Erro ao cancelar', 'Não foi possível cancelar o agendamento. Tente novamente.')
        setFeedbackMessage({ type: 'error', message: 'Erro ao cancelar agendamento. Tente novamente.' })
        setTimeout(() => setFeedbackMessage(null), 3000)
      }
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Cancelar Agendamento',
      message: 'Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.',
      onConfirm: performCancel,
      type: 'danger'
    })
  }

  const handleAlterarAgendamento = (consulta: ConsultaAgendada) => {
    onAlterarAgendamento(consulta)
    onClose()
  }

  const handleConfirmDialogClose = () => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  }

  const handleReabrirPix = (consulta: ConsultaAgendada) => {
    console.log("🔍 Reabrindo PIX para consulta:", consulta.id)
    console.log("🔍 Dados PIX da consulta:", {
      qrCodePix: consulta.qrCodePix ? "PRESENTE" : "AUSENTE",
      copyPastePix: consulta.copyPastePix ? "PRESENTE" : "AUSENTE",
      pixExpiresAt: consulta.pixExpiresAt,
    })

    // Verificar se os dados estão válidos
    if (!consulta.qrCodePix || consulta.qrCodePix.trim() === "") {
      console.error("❌ QR Code PIX ainda não disponível!")
      // Em vez de alert, vamos mostrar a tela de erro elegante que criamos
      setSelectedConsulta(consulta)
      return
    }

    setSelectedConsulta(consulta)
  }

  const handleEntrarReuniao = (googleMeetLink?: string) => {
    if (googleMeetLink) {
      // Garantir que o link tenha o protocolo correto
      let linkToOpen = googleMeetLink.trim();
      if (!linkToOpen.startsWith('http')) {
        linkToOpen = `https://${linkToOpen}`;
      }
      console.log("🔗 Abrindo link da reunião:", linkToOpen);
      window.open(linkToOpen, "_blank")
    } else {
      setFeedbackMessage({
        type: 'error',
        message: 'Link da reunião não disponível no momento.'
      })
      setTimeout(() => setFeedbackMessage(null), 5000)
    }
  }

  const handleVerificarPagamento = async (consulta: ConsultaAgendada) => {
    if (!consulta.paymentId) {
      setFeedbackMessage({
        type: 'error',
        message: 'ID do pagamento não encontrado. Não é possível verificar o status.'
      })
      return
    }

    try {
      const response = await fetch(`http://localhost:8001/api/v1/checkout/status/${consulta.paymentId}`)
      if (!response.ok) {
        throw new Error('Erro ao verificar pagamento')
      }

      const data = await response.json()
      console.log('Status do pagamento:', data)

      if (['RECEIVED', 'CONFIRMED', 'PAID', 'COMPLETED', 'APPROVED'].includes(data.status)) {
        // Atualizar status no contexto e forçar refresh do banco
        await refresh()
        setFeedbackMessage({
          type: 'success',
          message: 'Pagamento confirmado com sucesso! Status atualizado.'
        })
        setTimeout(() => setFeedbackMessage(null), 5000)
      } else if (data.status === 'PENDING') {
        setFeedbackMessage({
          type: 'info',
          message: 'Pagamento ainda está pendente. Aguarde a confirmação ou tente novamente em alguns instantes.'
        })
        setTimeout(() => setFeedbackMessage(null), 5000)
      } else if (data.status === 'REFUNDED' || data.status === 'CANCELLED') {
        setFeedbackMessage({
          type: 'error',
          message: 'Pagamento foi cancelado ou reembolsado. Entre em contato conosco para mais informações.'
        })
        setTimeout(() => setFeedbackMessage(null), 5000)
      } else {
        setFeedbackMessage({
          type: 'info',
          message: `Status do pagamento: ${data.status}. Entre em contato conosco se precisar de ajuda.`
        })
        setTimeout(() => setFeedbackMessage(null), 5000)
      }
    } catch (error) {
      console.error('Erro ao verificar pagamento:', error)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setFeedbackMessage({
          type: 'error',
          message: 'Erro de conexão. Verifique sua internet e tente novamente.'
        })
        setTimeout(() => setFeedbackMessage(null), 5000)
      } else {
        setFeedbackMessage({
          type: 'error',
          message: 'Erro ao verificar status do pagamento. Tente novamente.'
        })
        setTimeout(() => setFeedbackMessage(null), 5000)
      }
    }
  }

  const formatarData = (data: string | undefined | null) => {
    if (!data) return "Data não informada"

    try {
      const date = new Date(data)
      if (isNaN(date.getTime())) {
        return "Data inválida"
      }
      return date.toLocaleDateString("pt-BR")
    } catch (error) {
      console.error("Erro ao formatar data:", data, error)
      return "Data inválida"
    }
  }

  const formatarHorario = (horario: string | undefined | null) => {
    if (!horario) return "Horário não informado"
    return horario
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "text-green-600 bg-green-50 border-green-200"
      case "PENDING":
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case "CANCELLED":
        return "text-red-600 bg-red-50 border-red-200"
      case "EXPIRED":
        return "text-gray-600 bg-gray-50 border-gray-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "Confirmado"
      case "PENDING":
        return "Aguardando Pagamento"
      case "CANCELLED":
        return "Cancelado"
      case "EXPIRED":
        return "Expirado"
      default:
        return status || "Desconhecido"
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden shadow-2xl transform transition-all duration-300 scale-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <CalendarIcon size={20} weight="fill" className="text-blue-600" />
                  </div>
                  Minhas Consultas
                </h2>
                <p className="text-gray-600 mt-2">
                  Acompanhe seus agendamentos e reuniões
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl p-3 transition-all duration-200 disabled:opacity-50"
                  title="Atualizar dados do banco"
                >
                  {isRefreshing ? (
                    <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl p-3 transition-all duration-200"
                >
                  <XIcon size={20} weight="bold" />
                </button>
              </div>
            </div>
          </div>

          {/* Feedback Message */}
          {feedbackMessage && (
            <div className={`mx-8 mt-4 px-4 py-3 rounded-xl border ${
              feedbackMessage.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : feedbackMessage.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  feedbackMessage.type === 'success'
                    ? 'bg-green-100'
                    : feedbackMessage.type === 'error'
                    ? 'bg-red-100'
                    : 'bg-blue-100'
                }`}>
                  {feedbackMessage.type === 'success' ? (
                    <CheckIcon size={12} weight="bold" className="text-green-600" />
                  ) : feedbackMessage.type === 'error' ? (
                    <XIcon size={12} weight="bold" className="text-red-600" />
                  ) : (
                    <ClockIcon size={12} weight="bold" className="text-blue-600" />
                  )}
                </div>
                <p className="text-sm font-medium">{feedbackMessage.message}</p>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="overflow-y-auto max-h-[60vh] px-8 py-6">
            {isRefreshing && (
              <div className="flex items-center justify-center py-6 mb-6">
                <div className="flex items-center gap-3 text-blue-600 bg-blue-50 px-6 py-4 rounded-xl border border-blue-200">
                  <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  <span className="text-sm font-medium">Atualizando dados do banco...</span>
                </div>
              </div>
            )}

            {/* Feedback Message */}
            {feedbackMessage && (
              <div className="mb-6">
                <div className={`flex items-center gap-3 px-6 py-4 rounded-xl border ${
                  feedbackMessage.type === 'success'
                    ? 'text-green-800 bg-green-50 border-green-200'
                    : feedbackMessage.type === 'error'
                    ? 'text-red-800 bg-red-50 border-red-200'
                    : 'text-blue-800 bg-blue-50 border-blue-200'
                }`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    feedbackMessage.type === 'success'
                      ? 'bg-green-100'
                      : feedbackMessage.type === 'error'
                      ? 'bg-red-100'
                      : 'bg-blue-100'
                  }`}>
                    {feedbackMessage.type === 'success' ? (
                      <CheckIcon size={12} weight="bold" className="text-green-600" />
                    ) : feedbackMessage.type === 'error' ? (
                      <XIcon size={12} weight="bold" className="text-red-600" />
                    ) : (
                      <ClockIcon size={12} weight="bold" className="text-blue-600" />
                    )}
                  </div>
                  <span className="text-sm font-medium">{feedbackMessage.message}</span>
                </div>
              </div>
            )}

            {consultasAgendadas.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 max-w-md mx-auto">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <CalendarIcon size={32} className="text-gray-400" weight="light" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Nenhum agendamento encontrado
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Você ainda não possui consultas agendadas. Agende sua primeira consulta para começar.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Info sobre atualização de dados */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-sm text-blue-800 text-center font-medium">
                    💡 Use o botão 🔄 para atualizar os dados se necessário
                  </p>
                </div>

                {consultasAgendadas.map((consulta) => (
                  <div
                    key={consulta.id}
                    className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-gray-200 transition-all duration-300 overflow-hidden"
                  >
                    {/* Header simplificado */}
                    <div className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-200">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                          <CalendarIcon
                            size={20}
                            className="text-blue-600"
                            weight="fill"
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">
                            Consulta de Alinhamento
                          </h3>
                          <p className="text-sm text-gray-600">
                            Criado em {formatarData(consulta.createdAt)}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(consulta.status)}`}
                      >
                        {getStatusText(consulta.status)}
                      </span>
                    </div>

                    {/* Content - Versão simplificada e focada */}
                    <div className="p-6">
                      {/* Data e Horário - Destaque principal */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center">
                            <CalendarIcon
                              size={24}
                              className="text-white"
                              weight="fill"
                            />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-xl">
                              {formatarData(consulta.data)}
                            </p>
                            <p className="text-blue-700 font-semibold text-lg">
                              às {formatarHorario(consulta.horario)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Link do Google Meet - Só mostrar se disponível */}
                      {/* Link do Google Meet - Só mostrar se disponível */}
                      {(() => {
                        console.log("🔍 === ANÁLISE DETALHADA DO LINK NO FRONTEND ===");
                        console.log("📋 Dados da consulta:", {
                          id: consulta.id,
                          status: consulta.status,
                          googleMeetLink: consulta.googleMeetLink,
                          calendarEventId: consulta.calendar_event_id,
                          // Análises detalhadas
                          link_type: typeof consulta.googleMeetLink,
                          link_length: consulta.googleMeetLink?.length,
                          link_is_empty_string: consulta.googleMeetLink === "",
                          link_is_null: consulta.googleMeetLink === null,
                          link_is_undefined: consulta.googleMeetLink === undefined,
                          link_trimmed: consulta.googleMeetLink?.trim(),
                          link_trimmed_is_empty: consulta.googleMeetLink?.trim() === "",
                          link_trimmed_length: consulta.googleMeetLink?.trim()?.length,
                          status_is_confirmed: consulta.status === "CONFIRMED",
                          has_calendar_event: !!consulta.calendar_event_id,
                          // Verificar se é uma URL válida
                          is_valid_url: consulta.googleMeetLink?.startsWith('http'),
                          contains_meet: consulta.googleMeetLink?.includes('meet.google.com'),
                          // Verificar caracteres especiais
                          has_whitespace: /\s/.test(consulta.googleMeetLink || ''),
                          has_newlines: /\n/.test(consulta.googleMeetLink || ''),
                          raw_link_chars: consulta.googleMeetLink?.split('').map(c => c.charCodeAt(0))
                        });

                        // Condições simplificadas
                        const statusIsConfirmed = consulta.status === "CONFIRMED" || consulta.status === "PENDING";
                        const hasCalendarEvent = !!consulta.calendar_event_id;
                        const hasValidLink = consulta.googleMeetLink &&
                                           typeof consulta.googleMeetLink === 'string' &&
                                           consulta.googleMeetLink.trim().length > 0 &&
                                           (consulta.googleMeetLink.trim().startsWith('http') ||
                                            consulta.googleMeetLink.trim().includes('meet.google.com'));

                        console.log("🔍 Condições simplificadas:", {
                          statusIsConfirmed,
                          hasCalendarEvent,
                          hasValidLink,
                          googleMeetLink: consulta.googleMeetLink
                        });

                        console.log("🎯 DECISÃO FINAL:", {
                          hasValidLink,
                          hasCalendarEvent,
                          statusIsConfirmed,
                          action: hasValidLink ? "EXIBIR BOTÃO DA REUNIÃO" :
                                 statusIsConfirmed ? "EXIBIR MENSAGEM DE AGUARDAR LINK" :
                                 "NÃO EXIBIR NADA"
                        });
                        console.log("🔍 === FIM DA ANÁLISE ===");

                        return hasValidLink ? (
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-6">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                                <VideoCameraIcon
                                  size={18}
                                  className="text-green-600"
                                  weight="fill"
                                />
                              </div>
                              <span className="text-base font-semibold text-green-800">
                                Sala de reunião
                              </span>
                            </div>
                            <button
                              onClick={() => window.open(consulta.googleMeetLink, '_blank')}
                              className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center justify-center gap-3 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                              <VideoCameraIcon size={20} weight="fill" />
                              <ArrowUpRightIcon size={18} weight="fill" />
                              Entrar na reunião
                            </button>
                          </div>
                        ) : statusIsConfirmed ? (
                          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-4 mb-6">
                            <p className="text-yellow-800 text-center font-medium">
                              ⏳ Link da reunião será enviado em breve
                            </p>
                          </div>
                        ) : null
                      })()}                      {/* Ações simplificadas */}
                      <div className="space-y-4">
                        {consulta.status === "PENDING" && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                              onClick={() => handleReabrirPix(consulta)}
                              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 rounded-xl text-sm font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                              <QrCodeIcon size={18} weight="fill" />
                              Pagar agora
                            </button>
                            <button
                              onClick={() => handleVerificarPagamento(consulta)}
                              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-xl text-sm font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                              <CheckIcon size={18} weight="fill" />
                              Já paguei
                            </button>
                          </div>
                        )}

                        {consulta.status === "CONFIRMED" && (
                          <div className="space-y-4">
                            <button
                              onClick={() => handleAlterarAgendamento(consulta)}
                              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 rounded-xl text-sm font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                              <PencilSimpleIcon size={18} weight="fill" />
                              Reagendar
                            </button>
                          </div>
                        )}

                        <button
                          onClick={() => handleCancelarConsulta(consulta.id)}
                          className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-4 rounded-xl text-sm font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          <TrashIcon size={18} weight="fill" />
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal do PIX */}
      {selectedConsulta && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) =>
            e.target === e.currentTarget && setSelectedConsulta(null)
          }
        >
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl transform transition-all duration-300 scale-100">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <CreditCardIcon size={20} weight="fill" className="text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Pagamento PIX
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedConsulta(null)}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl p-2 transition-all duration-200"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              {(() => {
                console.log("🎯 MODAL PIX ABERTO - Verificando dados:", {
                  id: selectedConsulta.id,
                  qrCodePix: selectedConsulta.qrCodePix ? "PRESENTE" : "AUSENTE",
                  copyPastePix: selectedConsulta.copyPastePix ? "PRESENTE" : "AUSENTE",
                  pixExpiresAt: selectedConsulta.pixExpiresAt,
                })
                return null
              })()}

              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CreditCardIcon size={32} weight="light" className="text-gray-400" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2 text-2xl">
                  R$ {selectedConsulta.valor.toFixed(2)}
                </h4>
                <p className="text-gray-600">
                  {selectedConsulta.descricao}
                </p>
              </div>

              {selectedConsulta.qrCodePix ? (
                <div className="text-center">
                  <div className="bg-gray-50 border border-gray-200 p-6 rounded-xl mb-6 flex justify-center">
                    <QRCodeSVG
                      value={selectedConsulta.qrCodePix}
                      size={200}
                      level="M"
                      includeMargin={true}
                    />
                  </div>

                  {selectedConsulta.copyPastePix && (
                    <div className="mb-6">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Código PIX (Copie e Cole):
                      </label>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={selectedConsulta.copyPastePix}
                          readOnly
                          className="flex-1 bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          onClick={() =>
                            navigator.clipboard.writeText(
                              selectedConsulta.copyPastePix!
                            )
                          }
                          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-xl text-sm font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          <CopyIcon size={16} weight="fill" />
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedConsulta.pixExpiresAt && (
                    <div className="text-center text-sm text-gray-600 mb-6">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                        <p className="font-medium text-yellow-800">
                          ⏰ Expira em: {new Date(selectedConsulta.pixExpiresAt).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Botão Confirmar Pagamento */}
                  <button
                    className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                    onClick={async () => {
                      try {
                        const res = await fetch("/api/payments/manual-update", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ paymentId: selectedConsulta.id }),
                        })
                        if (!res.ok) {
                          const txt = await res.text()
                          setFeedbackMessage({
                            type: 'error',
                            message: `Erro ao confirmar pagamento: ${txt}`
                          })
                          setTimeout(() => setFeedbackMessage(null), 5000)
                          return
                        }
                        setFeedbackMessage({
                          type: 'success',
                          message: 'Solicitação de confirmação enviada! Aguarde a atualização do status.'
                        })
                        setTimeout(() => setFeedbackMessage(null), 5000)
                      } catch (err) {
                        if (err instanceof TypeError && err.message.includes('fetch')) {
                          setFeedbackMessage({
                            type: 'error',
                            message: 'Erro de conexão. Verifique sua internet e tente novamente.'
                          })
                          setTimeout(() => setFeedbackMessage(null), 5000)
                        } else {
                          setFeedbackMessage({
                            type: 'error',
                            message: `Erro ao enviar solicitação: ${err}`
                          })
                          setTimeout(() => setFeedbackMessage(null), 5000)
                        }
                      }
                    }}
                  >
                    Confirmar pagamento
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-6 mb-6">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-semibold text-red-800">
                        PIX Indisponível
                      </h4>
                    </div>
                    <p className="text-red-700 text-sm leading-relaxed mb-6">
                      Não foi possível carregar os dados do PIX neste momento. Isso pode acontecer devido a um problema técnico temporário.
                    </p>
                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          setSelectedConsulta(null)
                          handleRefresh()
                        }}
                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-xl text-sm font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        🔄 Tentar Novamente
                      </button>
                      <button
                        onClick={() => {
                          const message = encodeURIComponent(
                            `Olá! Não consigo visualizar o PIX do meu agendamento. ID: ${selectedConsulta.id}`
                          )
                          window.open(`https://wa.me/5511999999999?text=${message}`, '_blank')
                        }}
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3 rounded-xl text-sm font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        📱 Entrar em Contato
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dialog de Confirmação */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={() => {
          confirmDialog.onConfirm();
          handleConfirmDialogClose();
        }}
        onCancel={handleConfirmDialogClose}
        type={confirmDialog.type}
      />
    </>
  )
}

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
  const [selectedConsulta, setSelectedConsulta] =
    useState<ConsultaAgendada | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

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

  const handleCancelarConsulta = (consultaId: string) => {
    if (confirm("Tem certeza que deseja cancelar este agendamento?")) {
      removeConsulta(consultaId)
    }
  }

  const handleAlterarAgendamento = (consulta: ConsultaAgendada) => {
    onAlterarAgendamento(consulta)
    onClose()
  }

  const handleReabrirPix = (consulta: ConsultaAgendada) => {
    console.log("🔍 Reabrindo PIX para consulta:", consulta.id)
    console.log("🔍 Dados PIX da consulta:", {
      qrCodePix: consulta.qrCodePix?.substring(0, 50) + "...",
      copyPastePix: consulta.copyPastePix?.substring(0, 50) + "...",
      pixExpiresAt: consulta.pixExpiresAt,
    })
    setSelectedConsulta(consulta)
  }

  const handleEntrarReuniao = (googleMeetLink?: string) => {
    if (googleMeetLink) {
      window.open(googleMeetLink, "_blank")
    } else {
      alert("Link da reunião não disponível")
    }
  }

  const handleVerificarPagamento = async (consulta: ConsultaAgendada) => {
    try {
      const response = await fetch(`http://localhost:8001/api/v1/checkout/status/${consulta.paymentId}`)
      if (!response.ok) {
        throw new Error('Erro ao verificar pagamento')
      }

      const data = await response.json()
      console.log('Status do pagamento:', data)

      if (data.status === 'CONFIRMED' || data.status === 'RECEIVED') {
        // Atualizar status no contexto e forçar refresh do banco
        await refresh()
        alert('Pagamento confirmado com sucesso! Status atualizado.')
      } else if (data.status === 'PENDING') {
        alert('Pagamento ainda está pendente. Aguarde a confirmação ou tente novamente em alguns instantes.')
      } else if (data.status === 'REFUNDED' || data.status === 'CANCELLED') {
        alert('Pagamento foi cancelado ou reembolsado. Entre em contato conosco para mais informações.')
      } else {
        alert(`Status do pagamento: ${data.status}. Entre em contato conosco se precisar de ajuda.`)
      }
    } catch (error) {
      console.error('Erro ao verificar pagamento:', error)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        alert('Erro de conexão. Verifique sua internet e tente novamente.')
      } else {
        alert('Erro ao verificar status do pagamento. Tente novamente.')
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
        className="fixed inset-0 flex items-center justify-center z-50"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden mx-4 sm:mx-0">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                  <CalendarIcon size={20} weight="fill" className="sm:w-6 sm:h-6" />
                  Minhas Consultas
                </h2>
                <p className="text-blue-100 text-xs sm:text-sm mt-1">
                  Acompanhe seus agendamentos e reuniões
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="text-white hover:text-blue-200 transition-colors p-2 disabled:opacity-50"
                  title="Atualizar dados do banco"
                >
                  {isRefreshing ? (
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="text-white hover:text-blue-200 transition-colors p-1"
                >
                  <XIcon size={20} weight="bold" className="sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-100px)] sm:max-h-[calc(90vh-120px)]">
            {isRefreshing && (
              <div className="flex items-center justify-center py-4 mb-4">
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  <span className="text-sm">Atualizando dados do banco...</span>
                </div>
              </div>
            )}

            {consultasAgendadas.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <CalendarIcon
                  size={64}
                  className="text-gray-400 mx-auto mb-6"
                  weight="light"
                />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">
                  Nenhum agendamento encontrado
                </h3>
                <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto">
                  Você ainda não possui consultas agendadas. Agende sua primeira consulta para começar.
                </p>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {/* Info sobre atualização de dados */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-xs text-gray-600 text-center">
                    Use 🔄 para atualizar se necessário.
                  </p>
                </div>

                {consultasAgendadas.map((consulta) => (
                  <div
                    key={consulta.id}
                    className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-gray-200 transition-all duration-300 overflow-hidden"
                  >
                    {/* Header simplificado */}
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <CalendarIcon
                            size={20}
                            className="text-blue-600"
                            weight="fill"
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            Consulta de Alinhamento
                          </h3>
                          <p className="text-sm text-gray-600">
                            {formatarData(consulta.createdAt)}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(consulta.status)}`}
                      >
                        {getStatusText(consulta.status)}
                      </span>
                    </div>

                    {/* Content - Versão simplificada e focada */}
                    <div className="p-6">
                      {/* Data e Horário - Destaque principal */}
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-600 p-3 rounded-xl">
                            <CalendarIcon
                              size={20}
                              className="text-white"
                              weight="fill"
                            />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-lg">
                              {formatarData(consulta.data)}
                            </p>
                            <p className="text-blue-700 font-semibold">
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
                          status_is_confirmed: consulta.status === "CONFIRMED",
                          has_calendar_event: !!consulta.calendar_event_id
                        });

                        // Condições de verificação (mais claras e detalhadas)
                        const linkExists = consulta.googleMeetLink !== null && consulta.googleMeetLink !== undefined;
                        const linkIsString = typeof consulta.googleMeetLink === 'string';
                        const linkNotEmpty = consulta.googleMeetLink !== "";
                        const linkNotWhitespace = consulta.googleMeetLink?.trim() !== "";
                        const statusIsConfirmed = consulta.status === "CONFIRMED";
                        const hasCalendarEvent = !!consulta.calendar_event_id;

                        console.log("🔍 Condições de verificação:", {
                          linkExists,
                          linkIsString,
                          linkNotEmpty,
                          linkNotWhitespace,
                          statusIsConfirmed,
                          hasCalendarEvent,
                          final_hasValidLink: linkExists && linkIsString && linkNotEmpty && linkNotWhitespace
                        });

                        // Condição final para exibir o link
                        const hasValidLink = linkExists && linkIsString && linkNotEmpty && linkNotWhitespace;

                        console.log("🎯 DECISÃO FINAL:", {
                          hasValidLink,
                          action: hasValidLink ? "EXIBIR BOTÃO DA REUNIÃO" :
                                 (hasCalendarEvent && statusIsConfirmed) ? "EXIBIR MENSAGEM DE EVENTO CRIADO" :
                                 statusIsConfirmed ? "EXIBIR MENSAGEM DE AGUARDAR LINK" :
                                 "NÃO EXIBIR NADA"
                        });
                        console.log("🔍 === FIM DA ANÁLISE ===");

                        return hasValidLink ? (
                          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                            <div className="flex items-center gap-2 mb-3">
                              <VideoCameraIcon
                                size={18}
                                className="text-green-600 flex-shrink-0"
                                weight="fill"
                              />
                              <span className="text-sm font-medium text-green-800">
                                Sala de reunião
                              </span>
                            </div>
                            <button
                              onClick={() => handleEntrarReuniao(consulta.googleMeetLink)}
                              className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-medium"
                            >
                              <ArrowUpRightIcon size={16} weight="fill" />
                              Entrar na reunião
                            </button>
                          </div>
                        ) : hasCalendarEvent && statusIsConfirmed ? (
                          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
                            <p className="text-sm text-blue-800 text-center">
                              Reunião agendada! O link será enviado em breve.
                            </p>
                            <p className="text-xs text-blue-600 text-center mt-1">
                              Clique em 🔄 para atualizar se necessário
                            </p>
                          </div>
                        ) : statusIsConfirmed ? (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4">
                            <p className="text-sm text-yellow-800 text-center">
                              Link da reunião será enviado em breve
                            </p>
                          </div>
                        ) : null
                      })()}                      {/* Ações simplificadas */}
                      <div className="space-y-3">
                        {consulta.status === "PENDING" && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                              onClick={() => handleReabrirPix(consulta)}
                              className="bg-blue-600 text-white px-4 py-3 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                            >
                              <QrCodeIcon size={16} weight="fill" />
                              Pagar agora
                            </button>
                            <button
                              onClick={() => handleVerificarPagamento(consulta)}
                              className="bg-green-600 text-white px-4 py-3 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                            >
                              <CheckIcon size={16} weight="fill" />
                              Já paguei
                            </button>
                          </div>
                        )}

                        {consulta.status === "CONFIRMED" && (
                          <div className="space-y-3">
                            <button
                              onClick={() => handleAlterarAgendamento(consulta)}
                              className="w-full bg-blue-600 text-white px-4 py-3 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                            >
                              <PencilSimpleIcon size={16} weight="fill" />
                              Reagendar
                            </button>
                          </div>
                        )}

                        <button
                          onClick={() => handleCancelarConsulta(consulta.id)}
                          className="w-full bg-red-600 text-white px-4 py-3 rounded-xl text-sm font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <TrashIcon size={16} weight="fill" />
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
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={(e) =>
            e.target === e.currentTarget && setSelectedConsulta(null)
          }
        >
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 sm:mx-0">
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 sm:p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                  <CreditCardIcon size={20} weight="fill" className="sm:w-6 sm:h-6" />
                  Pagamento PIX
                </h3>
                <button
                  onClick={() => setSelectedConsulta(null)}
                  className="text-white hover:text-green-200 transition-colors p-1"
                >
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6"
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

            <div className="p-4 sm:p-6">
              <div className="text-center mb-4">
                <CreditCardIcon size={40} weight="light" className="mx-auto text-gray-400 sm:w-12 sm:h-12" />
                <h4 className="font-semibold text-gray-900 mb-1 text-lg sm:text-xl">
                  R$ {selectedConsulta.valor.toFixed(2)}
                </h4>
                <p className="text-sm text-gray-600">
                  {selectedConsulta.descricao}
                </p>
              </div>

              {selectedConsulta.qrCodePix ? (
                <div className="text-center">
                  <div className="bg-gray-100 p-4 rounded-lg mb-4 flex justify-center">
                    <QRCodeSVG
                      value={selectedConsulta.qrCodePix}
                      size={200}
                      level="M"
                      includeMargin={true}
                    />
                  </div>

                  {selectedConsulta.copyPastePix && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Código PIX (Copie e Cole):
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={selectedConsulta.copyPastePix}
                          readOnly
                          className="flex-1 bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                        <button
                          onClick={() =>
                            navigator.clipboard.writeText(
                              selectedConsulta.copyPastePix!
                            )
                          }
                          className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                        >
                          <CopyIcon size={16} weight="fill" />
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedConsulta.pixExpiresAt && (
                    <div className="text-center text-sm text-gray-600">
                      <p>
                        Expira em:{" "}
                        {new Date(selectedConsulta.pixExpiresAt).toLocaleString(
                          "pt-BR"
                        )}
                      </p>
                    </div>
                  )}

                  {/* Botão Confirmar Pagamento */}
                  <button
                    className="w-full py-2 bg-green-600 text-white rounded-lg font-semibold mt-4 hover:bg-green-700"
                    onClick={async () => {
                      try {
                        const res = await fetch("/api/payments/manual-update", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ paymentId: selectedConsulta.id }),
                        })
                        if (!res.ok) {
                          const txt = await res.text()
                          alert("Erro ao confirmar pagamento: " + txt)
                          return
                        }
                        alert("Solicitação de confirmação enviada! Aguarde a atualização do status.")
                      } catch (err) {
                        if (err instanceof TypeError && err.message.includes('fetch')) {
                          alert("Erro de conexão. Verifique sua internet e tente novamente.")
                        } else {
                          alert("Erro ao enviar solicitação: " + err)
                        }
                      }
                    }}
                  >
                    Confirmar pagamento
                  </button>
                </div>
              ) : (
                <div className="text-center text-gray-600">
                  <p>QR Code PIX não disponível</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

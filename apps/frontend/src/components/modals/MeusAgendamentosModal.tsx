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
  const { consultasAgendadas, removeConsulta } = useAgendamentos()
  const [selectedConsulta, setSelectedConsulta] =
    useState<ConsultaAgendada | null>(null)

  // Forçar re-render quando consultasAgendadas muda
  useEffect(() => {
    console.log(
      "📊 Agendamentos atualizados no modal:",
      consultasAgendadas.length
    )
  }, [consultasAgendadas])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
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

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString("pt-BR")
  }

  const formatarHorario = (horario: string) => {
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
        return "Desconhecido"
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
                  Meus Agendamentos
                </h2>
                <p className="text-blue-100 text-xs sm:text-sm mt-1">
                  Gerencie suas consultas agendadas
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-blue-200 transition-colors p-1"
              >
                <XIcon size={20} weight="bold" className="sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-3 sm:p-6 overflow-y-auto max-h-[calc(90vh-100px)] sm:max-h-[calc(90vh-120px)]">
            {consultasAgendadas.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <CalendarIcon
                  size={48}
                  className="text-gray-400 mx-auto mb-4 sm:w-16 sm:h-16"
                  weight="light"
                />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                  Nenhum agendamento encontrado
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Você ainda não possui consultas agendadas.
                </p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {consultasAgendadas.map((consulta) => (
                  <div
                    key={consulta.id}
                    className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow"
                  >
                    {/* Header da consulta */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="bg-blue-100 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
                          <CalendarIcon
                            size={16}
                            className="text-blue-600 sm:w-5 sm:h-5"
                            weight="fill"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base leading-tight">
                            Consulta - {formatarData(consulta.data)} às{" "}
                            {formatarHorario(consulta.horario)}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600">
                            Criado em {formatarData(consulta.createdAt)}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium border flex-shrink-0 self-start sm:self-center ${getStatusColor(consulta.status)}`}
                      >
                        {getStatusText(consulta.status)}
                      </span>
                    </div>

                    {/* Detalhes da consulta */}
                    <div className="bg-gray-50 rounded-lg p-2 sm:p-3 mb-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                        <div>
                          <span className="font-medium text-gray-700">
                            Cliente:
                          </span>
                          <p className="text-gray-900 truncate">
                            {consulta.cliente.nome}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">
                            Valor:
                          </span>
                          <p className="text-gray-900">
                            R$ {consulta.valor.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">
                            Email:
                          </span>
                          <p className="text-gray-900 truncate text-xs sm:text-sm">
                            {consulta.cliente.email}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">
                            Telefone:
                          </span>
                          <p className="text-gray-900">
                            {consulta.cliente.telefone}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Status do pagamento */}
                    {consulta.status === "PENDING" && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 sm:p-3 mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <ClockIcon
                            size={14}
                            className="text-yellow-600 flex-shrink-0 sm:w-4 sm:h-4"
                            weight="fill"
                          />
                          <span className="text-xs sm:text-sm font-medium text-yellow-800">
                            Aguardando pagamento
                          </span>
                        </div>
                        <p className="text-xs text-yellow-700 leading-relaxed">
                          O pagamento deve ser realizado em até 24 horas para
                          confirmar o agendamento.
                        </p>
                      </div>
                    )}

                    {/* Link do Google Meet para consultas confirmadas */}
                    {consulta.status === "CONFIRMED" &&
                      consulta.googleMeetLink && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-2 sm:p-3 mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <VideoCameraIcon
                              size={14}
                              className="text-green-600 flex-shrink-0 sm:w-4 sm:h-4"
                              weight="fill"
                            />
                            <span className="text-xs sm:text-sm font-medium text-green-800">
                              Reunião confirmada
                            </span>
                          </div>
                          <p className="text-xs text-green-700 mb-2 leading-relaxed">
                            Sua consulta foi confirmada e o link do Google Meet
                            está disponível.
                          </p>
                          <button
                            onClick={() =>
                              handleEntrarReuniao(consulta.googleMeetLink)
                            }
                            className="bg-green-600 text-white px-2 sm:px-3 py-1 rounded text-xs font-medium hover:bg-green-700 transition-colors flex items-center gap-1"
                          >
                            <ArrowUpRightIcon size={12} weight="fill" />
                            Entrar na reunião
                          </button>
                        </div>
                      )}

                    {/* Ações */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      {consulta.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => handleReabrirPix(consulta)}
                            className="flex-1 bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                          >
                            <QrCodeIcon size={14} weight="fill" className="sm:w-4 sm:h-4" />
                            Reabrir PIX
                          </button>
                          <button
                            onClick={() => handleAlterarAgendamento(consulta)}
                            className="flex-1 bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                          >
                            <PencilSimpleIcon size={14} weight="fill" className="sm:w-4 sm:h-4" />
                            Alterar
                          </button>
                        </>
                      )}

                      {consulta.status === "CONFIRMED" && (
                        <button
                          onClick={() => handleAlterarAgendamento(consulta)}
                          className="flex-1 bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-green-700 transition-colors"
                        >
                          ✏️ Alterar
                        </button>
                      )}

                      <button
                        onClick={() => handleCancelarConsulta(consulta.id)}
                        className="bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2 sm:w-auto w-full"
                      >
                        <TrashIcon size={14} weight="fill" className="sm:w-4 sm:h-4" />
                        Cancelar
                      </button>
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
                        alert("Erro ao enviar solicitação: " + err)
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

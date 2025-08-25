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
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <CalendarIcon size={24} weight="fill" />
                  Meus Agendamentos
                </h2>
                <p className="text-blue-100 text-sm mt-1">
                  Gerencie suas consultas agendadas
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-blue-200 transition-colors"
              >
                <XIcon size={24} weight="bold" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {consultasAgendadas.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon
                  size={64}
                  className="text-gray-400 mx-auto mb-4"
                  weight="light"
                />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhum agendamento encontrado
                </h3>
                <p className="text-gray-600">
                  Você ainda não possui consultas agendadas.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {consultasAgendadas.map((consulta) => (
                  <div
                    key={consulta.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    {/* Header da consulta */}
                    <div className="flex items-center justify-between mb-3">
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
                            Consulta - {formatarData(consulta.data)} às{" "}
                            {formatarHorario(consulta.horario)}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Criado em {formatarData(consulta.createdAt)}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(consulta.status)}`}
                      >
                        {getStatusText(consulta.status)}
                      </span>
                    </div>

                    {/* Detalhes da consulta */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">
                            Cliente:
                          </span>
                          <p className="text-gray-900">
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
                          <p className="text-gray-900">
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
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <ClockIcon
                            size={16}
                            className="text-yellow-600"
                            weight="fill"
                          />
                          <span className="text-sm font-medium text-yellow-800">
                            Aguardando pagamento
                          </span>
                        </div>
                        <p className="text-xs text-yellow-700">
                          O pagamento deve ser realizado em até 24 horas para
                          confirmar o agendamento.
                        </p>
                      </div>
                    )}

                    {/* Link do Google Meet para consultas confirmadas */}
                    {consulta.status === "CONFIRMED" &&
                      consulta.googleMeetLink && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <VideoCameraIcon
                              size={16}
                              className="text-green-600"
                              weight="fill"
                            />
                            <span className="text-sm font-medium text-green-800">
                              Reunião confirmada
                            </span>
                          </div>
                          <p className="text-xs text-green-700 mb-2">
                            Sua consulta foi confirmada e o link do Google Meet
                            está disponível.
                          </p>
                          <button
                            onClick={() =>
                              handleEntrarReuniao(consulta.googleMeetLink)
                            }
                            className="bg-green-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-green-700 transition-colors flex items-center gap-1"
                          >
                            <ArrowUpRightIcon size={12} weight="fill" />
                            Entrar na reunião
                          </button>
                        </div>
                      )}

                    {/* Ações */}
                    <div className="flex gap-2">
                      {consulta.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => handleReabrirPix(consulta)}
                            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                          >
                            <QrCodeIcon size={16} weight="fill" />
                            Reabrir PIX
                          </button>
                          <button
                            onClick={() => handleAlterarAgendamento(consulta)}
                            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                          >
                            <PencilSimpleIcon size={16} weight="fill" />
                            Alterar
                          </button>
                        </>
                      )}

                      {consulta.status === "CONFIRMED" && (
                        <button
                          onClick={() => handleAlterarAgendamento(consulta)}
                          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                        >
                          ✏️ Alterar
                        </button>
                      )}

                      <button
                        onClick={() => handleCancelarConsulta(consulta.id)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <TrashIcon size={16} weight="fill" />
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
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) =>
            e.target === e.currentTarget && setSelectedConsulta(null)
          }
        >
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <CreditCardIcon size={24} weight="fill" />
                  Pagamento PIX
                </h3>
                <button
                  onClick={() => setSelectedConsulta(null)}
                  className="text-white hover:text-green-200 transition-colors"
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
              <div className="text-center mb-4">
                <CreditCardIcon size={48} weight="light" />
                <h4 className="font-semibold text-gray-900 mb-1">
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

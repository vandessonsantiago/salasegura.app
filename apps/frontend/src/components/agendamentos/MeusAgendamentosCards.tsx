"use client"

import React from 'react'
import { CalendarIcon, VideoCameraIcon, CheckCircleIcon, ClockIcon, ArrowUpRightIcon, UserIcon, PhoneIcon, EnvelopeIcon, CurrencyDollarIcon } from '@phosphor-icons/react'
import { useAgendamentos } from '@/contexts/AgendamentosContext'

interface MeusAgendamentosCardsProps {
  onAbrirModal: () => void
}

export default function MeusAgendamentosCards({ onAbrirModal }: MeusAgendamentosCardsProps) {
  const { consultasAgendadas, formatDate, formatStatus } = useAgendamentos()

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <CheckCircleIcon size={24} className="text-white" weight="fill" />
      case 'PENDING':
        return <ClockIcon size={24} className="text-white" weight="fill" />
      default:
        return <CalendarIcon size={24} className="text-white" weight="fill" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-gradient-to-r from-green-500 to-green-600'
      case 'PENDING':
        return 'bg-gradient-to-r from-yellow-500 to-yellow-600'
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'Consulta Confirmada'
      case 'PENDING':
        return 'Aguardando Pagamento'
      case 'CANCELLED':
        return 'Agendamento Cancelado'
      case 'EXPIRED':
        return 'Pagamento Expirado'
      default:
        return status
    }
  }

  const getStatusDescription = (status: string, consulta: any) => {
    switch (status) {
      case 'PENDING':
        return 'Realize o pagamento PIX em até 24 horas para confirmar sua consulta'
      case 'CONFIRMED':
        return 'Sua consulta está confirmada e o link da reunião será enviado em breve'
      case 'CANCELLED':
        return 'Este agendamento foi cancelado'
      case 'EXPIRED':
        return 'O prazo para pagamento expirou. Refaça o agendamento se necessário'
      default:
        return ''
    }
  }

  if (consultasAgendadas.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CalendarIcon size={32} className="text-blue-600" weight="light" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">
          Nenhum agendamento encontrado
        </h3>
        <p className="text-gray-600 mb-8 max-w-sm mx-auto leading-relaxed">
          Você ainda não possui consultas agendadas. Que tal marcar sua primeira consulta?
        </p>
        <button
          onClick={onAbrirModal}
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          Ver Todos os Agendamentos
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">
            Meus Agendamentos
          </h3>
          <p className="text-gray-600 mt-1">
            {consultasAgendadas.length} consulta{consultasAgendadas.length !== 1 ? 's' : ''} agendada{consultasAgendadas.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={onAbrirModal}
          className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-2 hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors"
        >
          Ver todos
          <ArrowUpRightIcon size={16} weight="bold" />
        </button>
      </div>

      {/* Cards */}
      <div className="space-y-4">
        {consultasAgendadas.slice(0, 2).map((consulta) => (
          <div
            key={consulta.id}
            className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-gray-200 transition-all duration-300 overflow-hidden"
          >
            {/* Status Bar */}
            <div className={`${getStatusColor(consulta.status)} px-6 py-4 text-white relative overflow-hidden`}>
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                    {getStatusIcon(consulta.status)}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-white">
                      Consulta de Alinhamento
                    </h4>
                    <p className="text-white/90 text-sm">
                      {getStatusText(consulta.status)}
                    </p>
                    {consulta.status === 'PENDING' && (
                      <p className="text-white/80 text-xs mt-1">
                        Prazo: 24h para pagamento
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">
                    R$ {consulta.valor.toFixed(2)}
                  </div>
                  <div className="text-white/90 text-sm">
                    {formatDate(consulta.data)}
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Data e Horário */}
              <div className="flex items-center gap-3 mb-6 p-4 bg-gray-50 rounded-xl">
                <div className="bg-blue-100 p-3 rounded-xl">
                  <CalendarIcon size={20} className="text-blue-600" weight="fill" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {formatDate(consulta.data)} às {consulta.horario}
                  </p>
                  <p className="text-gray-600 text-sm">
                    Criado em {formatDate(consulta.createdAt)}
                  </p>
                </div>
              </div>

              {/* Informações do Cliente */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <UserIcon size={16} className="text-blue-600" weight="fill" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">Cliente</p>
                      <p className="font-semibold text-gray-900">{consulta.cliente.nome || 'Não informado'}</p>
                    </div>
                  </div>

                  {consulta.cliente.email && (
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <EnvelopeIcon size={16} className="text-blue-600" weight="fill" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">Email</p>
                        <p className="font-semibold text-gray-900 truncate">{consulta.cliente.email}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {consulta.cliente.telefone && (
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <PhoneIcon size={16} className="text-blue-600" weight="fill" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">Telefone</p>
                        <p className="font-semibold text-gray-900">{consulta.cliente.telefone}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <CurrencyDollarIcon size={16} className="text-blue-600" weight="fill" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">Valor</p>
                      <p className="font-bold text-green-600 text-lg">R$ {consulta.valor.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informações adicionais para status pendente */}
              {consulta.status === 'PENDING' && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mt-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <CurrencyDollarIcon size={16} className="text-blue-600" weight="fill" />
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 uppercase tracking-wide font-medium">Valor a pagar</p>
                      <p className="font-bold text-blue-800 text-lg">R$ {consulta.valor.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <p className="text-blue-700 text-sm">
                      💡 <strong>Dica:</strong> Após o pagamento, a confirmação pode levar até 5 minutos
                    </p>
                  </div>
                </div>
              )}

              {/* Ações */}
              <div className="space-y-3">
                {consulta.status === 'CONFIRMED' && consulta.googleMeetLink && (
                  <button
                    onClick={() => window.open(consulta.googleMeetLink, '_blank')}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center justify-center gap-3 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <VideoCameraIcon size={20} weight="fill" />
                    Entrar na reunião
                  </button>
                )}

                {consulta.status === 'PENDING' && (
                  <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-yellow-200 p-2 rounded-lg">
                        <ClockIcon size={16} className="text-yellow-700" weight="fill" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-yellow-800 mb-1">
                          Aguardando confirmação do pagamento
                        </p>
                        <p className="text-yellow-700 text-sm mb-3">
                          {getStatusDescription(consulta.status, consulta)}
                        </p>
                        {consulta.copyPastePix && (
                          <div className="bg-white rounded-lg p-3 border border-yellow-300">
                            <p className="text-xs text-gray-600 mb-2 font-medium">Código PIX para copiar:</p>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 text-xs bg-gray-100 p-2 rounded font-mono text-gray-800 break-all">
                                {consulta.copyPastePix}
                              </code>
                              <button
                                onClick={() => {
                                  if (consulta.copyPastePix) {
                                    navigator.clipboard.writeText(consulta.copyPastePix)
                                    // Você pode adicionar um toast de sucesso aqui
                                  }
                                }}
                                className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                              >
                                Copiar
                              </button>
                            </div>
                          </div>
                        )}
                        {consulta.pixExpiresAt && (
                          <p className="text-yellow-600 text-xs mt-2">
                            Expira em: {new Date(consulta.pixExpiresAt).toLocaleString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Ver mais */}
      {consultasAgendadas.length > 2 && (
        <button
          onClick={onAbrirModal}
          className="w-full bg-white border-2 border-dashed border-gray-300 text-gray-700 py-4 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 font-semibold flex items-center justify-center gap-2"
        >
          Ver mais {consultasAgendadas.length - 2} agendamento(s)
          <ArrowUpRightIcon size={16} weight="bold" />
        </button>
      )}
    </div>
  )
}
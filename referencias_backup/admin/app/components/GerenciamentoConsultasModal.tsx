'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

interface ConsultaAgendada {
  id: string;
  data: string;
  horario: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  paymentId: string;
  paymentStatus: 'PENDING' | 'CONFIRMED' | 'OVERDUE' | 'REFUNDED';
  valor: number;
  descricao: string;
  cliente: {
    nome: string;
    email: string;
    telefone: string;
  };
  createdAt: string;
}

interface GerenciamentoConsultasModalProps {
  isOpen: boolean;
  onClose: () => void;
  consultas: ConsultaAgendada[];
  onCancelarConsulta: (consultaId: string) => void;
  onReagendarConsulta: (consultaId: string) => void;
}

export default function GerenciamentoConsultasModal({
  isOpen,
  onClose,
  consultas,
  onCancelarConsulta,
  onReagendarConsulta,
}: GerenciamentoConsultasModalProps) {
  const [selectedConsulta, setSelectedConsulta] = useState<ConsultaAgendada | null>(null);
  const [loading, setLoading] = useState(false);

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatarHorario = (horario: string) => {
    return horario;
  };

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      CONFIRMED: { label: 'Confirmada', color: 'bg-green-100 text-green-800 border-green-200' },
      CANCELLED: { label: 'Cancelada', color: 'bg-red-100 text-red-800 border-red-200' },
      COMPLETED: { label: 'Concluída', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { label: 'Aguardando Pagamento', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      CONFIRMED: { label: 'Pago', color: 'bg-green-100 text-green-800 border-green-200' },
      OVERDUE: { label: 'Vencido', color: 'bg-red-100 text-red-800 border-red-200' },
      REFUNDED: { label: 'Reembolsado', color: 'bg-gray-100 text-gray-800 border-gray-200' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const handleCancelarConsulta = async (consultaId: string) => {
    if (!confirm('Tem certeza que deseja cancelar esta consulta?')) {
      return;
    }

    setLoading(true);
    try {
      await onCancelarConsulta(consultaId);
      toast.success('Consulta cancelada com sucesso!');
      setSelectedConsulta(null);
    } catch (error) {
      toast.error('Erro ao cancelar consulta');
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Gerenciamento de Consultas
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {consultas.length} consulta{consultas.length !== 1 ? 's' : ''} agendada{consultas.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex h-[calc(90vh-80px)]">
          {/* Lista de consultas */}
          <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
            <div className="p-4">
              {consultas.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-6xl mb-4">📅</div>
                  <p className="text-gray-600">Nenhuma consulta agendada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {consultas.map((consulta) => (
                    <div
                      key={consulta.id}
                      onClick={() => setSelectedConsulta(consulta)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedConsulta?.id === consulta.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">
                            {formatarData(consulta.data)}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {formatarHorario(consulta.horario)}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            {getStatusBadge(consulta.status)}
                            {getPaymentStatusBadge(consulta.paymentStatus)}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            {formatarValor(consulta.valor)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Detalhes da consulta */}
          <div className="flex-1 overflow-y-auto">
            {selectedConsulta ? (
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Detalhes da Consulta
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data
                      </label>
                      <p className="text-gray-900">{formatarData(selectedConsulta.data)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Horário
                      </label>
                      <p className="text-gray-900">{formatarHorario(selectedConsulta.horario)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status da Consulta
                      </label>
                      <div className="mt-1">{getStatusBadge(selectedConsulta.status)}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status do Pagamento
                      </label>
                      <div className="mt-1">{getPaymentStatusBadge(selectedConsulta.paymentStatus)}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valor
                      </label>
                      <p className="text-gray-900 font-medium">{formatarValor(selectedConsulta.valor)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ID do Pagamento
                      </label>
                      <p className="text-gray-900 text-sm font-mono">{selectedConsulta.paymentId}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Dados do Cliente</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome
                      </label>
                      <p className="text-gray-900">{selectedConsulta.cliente.nome}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <p className="text-gray-900">{selectedConsulta.cliente.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Telefone
                      </label>
                      <p className="text-gray-900">{selectedConsulta.cliente.telefone}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Agendado em
                      </label>
                      <p className="text-gray-900">{formatarData(selectedConsulta.createdAt)}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-2">Descrição</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {selectedConsulta.descricao}
                  </p>
                </div>

                {/* Ações */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  {selectedConsulta.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => onReagendarConsulta(selectedConsulta.id)}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Reagendar
                      </button>
                      <button
                        onClick={() => handleCancelarConsulta(selectedConsulta.id)}
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        {loading ? 'Cancelando...' : 'Cancelar Consulta'}
                      </button>
                    </>
                  )}
                  {selectedConsulta.status === 'CONFIRMED' && (
                    <button
                      onClick={() => onReagendarConsulta(selectedConsulta.id)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Reagendar
                    </button>
                  )}
                  
                  {/* Botão de teste para simular webhook - SEMPRE VISÍVEL PARA TESTE */}
                  <button
                    onClick={async () => {
                      try {
                        console.log(`🧪 Testando webhook para paymentId: ${selectedConsulta.paymentId}`);
                        
                        const response = await fetch('https://api-salasegura.vandessonsantiago.com/api/v1/webhook/test', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            paymentId: selectedConsulta.paymentId,
                            event: 'PAYMENT_CONFIRMED'
                          })
                        });
                        
                        const result = await response.json();
                        console.log('🧪 Resultado do teste:', result);
                        
                        if (result.success) {
                          alert('✅ Webhook testado com sucesso! Verifique se o status foi atualizado.');
                        } else {
                          alert('❌ Erro no teste do webhook');
                        }
                      } catch (error) {
                        console.error('Erro ao testar webhook:', error);
                        alert('❌ Erro ao testar webhook');
                      }
                    }}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors mt-2"
                  >
                    🧪 Testar Webhook (Simular Pagamento)
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-gray-400 text-6xl mb-4">👆</div>
                  <p className="text-gray-600">Selecione uma consulta para ver os detalhes</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

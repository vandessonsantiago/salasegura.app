"use client"

import React, { useState } from 'react'
import { X, Users, CheckCircle, Clock, FileText, ChatCircle } from '@phosphor-icons/react'
import { useDivorce } from '@/contexts/DivorceContext'
import DivorcioExpressModal from './DivorcioExpressModal'

interface MeuDivorcioModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function MeuDivorcioModal({ isOpen, onClose }: MeuDivorcioModalProps) {
  const { currentCase, formatStatus } = useDivorce()
  const [showDivorcioExpressModal, setShowDivorcioExpressModal] = useState(false)

  if (!isOpen || !currentCase) return null

  const statusInfo = formatStatus(currentCase.status)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return <Clock size={20} className="text-orange-500" />
      case 'payment_confirmed':
        return <CheckCircle size={20} className="text-green-500" />
      case 'in_progress':
        return <FileText size={20} className="text-blue-500" />
      case 'completed':
        return <CheckCircle size={20} className="text-green-500" />
      default:
        return <Clock size={20} className="text-gray-500" />
    }
  }

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return 'Aguardando confirmação do pagamento PIX'
      case 'payment_confirmed':
        return 'Pagamento confirmado! Seu processo foi iniciado'
      case 'in_progress':
        return 'Seu divórcio está em andamento'
      case 'completed':
        return 'Seu divórcio foi concluído com sucesso!'
      default:
        return 'Status desconhecido'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[95vh] overflow-hidden shadow-2xl transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users size={20} className="text-blue-600" />
                </div>
                Meu Divórcio Express
              </h2>
              <p className="text-gray-600 mt-2">
                Acompanhe o status do seu processo
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl p-3 transition-all duration-200"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[60vh] px-8 py-6">
          {/* Status Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-4">
              {getStatusIcon(currentCase.status)}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Status: {statusInfo.text}
                </h3>
                <p className="text-gray-600 mt-1">
                  {getStatusMessage(currentCase.status)}
                </p>
              </div>
            </div>
          </div>

          {/* Detalhes do Processo */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText size={20} className="text-gray-600" />
              Detalhes do Processo
            </h3>

            <div className="grid gap-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">ID do Caso</span>
                <span className="font-mono text-sm text-gray-900">{currentCase.id.slice(0, 8)}...</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">Tipo</span>
                <span className="text-gray-900">{currentCase.type === 'express' ? 'Divórcio Express' : currentCase.type}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">Valor</span>
                <span className="font-semibold text-gray-900">R$ {currentCase.valor.toFixed(2).replace('.', ',')}</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Data de Início</span>
                <span className="text-gray-900">{new Date(currentCase.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          </div>

          {/* Pagamento Pendente */}
          {currentCase.status === 'pending_payment' && (
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Clock size={20} className="text-orange-600" />
                Pagamento Pendente
              </h3>

              <p className="text-gray-700 mb-4">
                Você iniciou o processo de divórcio, mas ainda não concluiu o pagamento.
                Clique no botão abaixo para retomar e gerar o PIX.
              </p>

              <button 
                onClick={() => setShowDivorcioExpressModal(true)}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-medium text-sm shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <Clock size={18} />
                Retomar Pagamento
              </button>
            </div>
          )}

          {/* Próximos Passos */}
          {currentCase.status === 'payment_confirmed' && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle size={20} className="text-green-600" />
                Próximos Passos
              </h3>

              <div className="space-y-3 text-gray-700">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-green-700">1</span>
                  </div>
                  <p>Entraremos em contato por e-mail para agendar uma conversa inicial</p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-green-700">2</span>
                  </div>
                  <p>Durante a conversa, coletaremos todas as informações necessárias</p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-green-700">3</span>
                  </div>
                  <p>Prepararemos toda a documentação necessária para o cartório</p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-green-700">4</span>
                  </div>
                  <p>Acompanharemos todo o processo até a homologação final</p>
                </div>
              </div>
            </div>
          )}

          {/* Suporte */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <ChatCircle size={20} className="text-blue-600" />
              Precisa de Ajuda?
            </h3>

            <p className="text-gray-600 mb-4">
              Nossa equipe está aqui para ajudar você em todas as etapas do processo.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium text-sm shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2">
                <ChatCircle size={18} />
                Falar com Suporte
              </button>

              <button className="flex-1 bg-white border border-blue-300 text-blue-700 px-6 py-3 rounded-xl hover:bg-blue-50 transition-all duration-200 font-medium text-sm flex items-center justify-center gap-2">
                <FileText size={18} />
                Ver Documentos
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-8 py-6 border-t border-gray-200">
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-8 py-3 rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 font-semibold text-base shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
      <DivorcioExpressModal
        isOpen={showDivorcioExpressModal}
        onClose={() => setShowDivorcioExpressModal(false)}
        existingCaseId={currentCase.id}
      />
    </div>
  )
}

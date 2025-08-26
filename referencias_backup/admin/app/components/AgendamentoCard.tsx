'use client';

import { useState } from 'react';
import { CalendarIcon } from '@phosphor-icons/react';
import { useAgendamentos } from '../../contexts/AgendamentosContext';
import AgendamentoModal from './AgendamentoModal';
import MeusAgendamentosModal from './MeusAgendamentosModal';

export default function AgendamentoCard() {
  const [showModal, setShowModal] = useState(false);
  const [showMeusAgendamentos, setShowMeusAgendamentos] = useState(false);
  const { hasConsultas } = useAgendamentos();

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleConfirmarAgendamento = (data: string, horario: string) => {
    console.log('Agendamento confirmado:', { data, horario });
  };

  const handleAlterarAgendamento = (consulta: any) => {
    console.log('Alterando agendamento:', consulta);
    setShowModal(true);
  };

  return (
    <>
              {/* Card de Agendamento */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-lg mx-auto mb-4 shadow-sm relative">
          {/* Etiqueta de Preço Promocional */}
          <div className="absolute -top-3 -left-6 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-bold px-4 py-2 rounded-lg shadow-lg border-2 border-white w-24">
            <div className="text-center">
              <div className="line-through text-xs opacity-75">R$ 759</div>
              <div className="text-base font-bold">R$ 99</div>
            </div>
          </div>        
                  <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="bg-blue-50 p-3 rounded-lg">
                <img 
                  src="/calendario.png" 
                  alt="Calendário" 
                  className="w-6 h-6" 
                />
              </div>
            </div>
          <div className="flex-1 text-left">
            <h3 className="text-base font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <CalendarIcon size={18} weight="fill" />
              Agendar Alinhamento Inicial
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Consulta de 45 minutos - Custo acessível para analisar seu caso.
            </p>
            
            {/* Informações rápidas */}
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300 shadow-sm">
                ⏱️ 45 min
              </span>
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300 shadow-sm">
                💻 Online
              </span>
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border border-purple-300 shadow-sm">
                💰 Custo Acessível
              </span>
            </div>
            
            <button 
              onClick={hasConsultas ? () => setShowMeusAgendamentos(true) : handleOpenModal}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              {hasConsultas ? 'MEUS AGENDAMENTOS' : 'AGENDAR CONSULTA'}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Agendamento */}
      <AgendamentoModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onAgendar={handleConfirmarAgendamento}
      />

      {/* Modal Meus Agendamentos */}
      <MeusAgendamentosModal
        isOpen={showMeusAgendamentos}
        onClose={() => setShowMeusAgendamentos(false)}
        onAlterarAgendamento={handleAlterarAgendamento}
      />
    </>
  );
}

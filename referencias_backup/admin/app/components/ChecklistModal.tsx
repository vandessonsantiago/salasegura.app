'use client';

import { useState, useEffect } from 'react';
import { useChecklist, type ChecklistItem } from '../../contexts/ChecklistContext';

interface ChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAgendamento?: () => void;
}

export default function ChecklistModal({ isOpen, onClose, onOpenAgendamento }: ChecklistModalProps) {
  const { 
    sessions,
    currentSession, 
    loading, 
    error,
    createSession, 
    loadSession, 
    updateItem,
    clearError
  } = useChecklist();

  const [localItems, setLocalItems] = useState<ChecklistItem[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;
  const [showTooltip, setShowTooltip] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar dispositivo móvel
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fechar tooltip ao clicar fora em dispositivos móveis
  useEffect(() => {
    if (!isMobile || !showTooltip) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.tooltip-container')) {
        setShowTooltip(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobile, showTooltip]);

  // Criar ou carregar sessão quando o modal abre
  useEffect(() => {
    if (!isOpen || loading) return;

    // Aguardar um tick para garantir que o Context foi inicializado
    const timer = setTimeout(async () => {
      try {
        // Se não há sessão atual, verificar se existe uma sessão de checklist
        if (!currentSession) {
          const existingChecklistSession = sessions.find(s => s.title.includes('Checklist'));
          
          if (existingChecklistSession) {
            // Carregar sessão existente
            await loadSession(existingChecklistSession.id);
          } else {
            // Criar nova sessão apenas se não há nenhuma sessão
            if (sessions.length === 0) {
              await createSession();
            }
          }
        }
      } catch (error) {
        console.error('Erro ao inicializar checklist:', error);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen, currentSession, sessions, loading, createSession, loadSession]);

  // Sincronizar itens locais com a sessão atual
  useEffect(() => {
    if (currentSession?.items) {
      setLocalItems(currentSession.items);
    }
  }, [currentSession]);

  const handleToggleItem = async (itemId: string) => {
    if (!currentSession) return;

    const item = localItems.find(item => item.id === itemId);
    if (!item) return;

    const newChecked = !item.checked;
    
    // Atualizar localmente primeiro para UX
    setLocalItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, checked: newChecked } : item
      )
    );

    // Persistir no backend usando item_id (ex: "1.1", "2.3")
    await updateItem(currentSession.id, item.item_id, newChecked);
  };

  const getProgress = () => {
    if (!currentSession) return 0;
    return Math.round((currentSession.progress / currentSession.total_items) * 100);
  };

  const getCategoryTitle = (category: string) => {
    const titles: Record<string, string> = {
      elegibilidade: 'Elegibilidade do procedimento no cartório',
      documentos: 'Documentos pessoais e do casamento',
      filhos: 'Filhos (se houver filhos maiores e capazes)',
      patrimonio: 'Patrimônio e dívidas (se houver partilha)',
      alimentos: 'Alimentos e retomada do nome',
      procuração: 'Procuração e assinaturas'
    };
    return titles[category] || category;
  };

  const getCategoryItems = (category: string) => {
    return localItems.filter(item => item.category === category);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleAgendarAlinhamento = () => {
    // Fechar modal do checklist e abrir modal de agendamento
    console.log('Agendar Alinhamento Inicial');
    onClose();
    if (onOpenAgendamento) {
      onOpenAgendamento();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Checklist "Você está pronto(a) para o cartório?"
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Pronto(a) para a Escritura de Divórcio Consensual?
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
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progresso: {getProgress()}%</span>
              <span>{currentSession?.progress || 0} de {currentSession?.total_items || 0} itens</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getProgress()}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[60vh] p-6">
          {error ? (
            <div className="text-center py-8">
              <div className="text-red-600 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-red-600 font-medium mb-2">Erro ao carregar checklist</p>
              <p className="text-gray-600 text-sm mb-4">{error}</p>
              <button
                onClick={() => {
                  clearError();
                  window.location.reload();
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Tentar novamente
              </button>
            </div>
          ) : loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando checklist...</p>
            </div>
          ) : (
            <>
              {/* Introdução */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-gray-700 text-sm leading-relaxed">
              Queremos tornar este momento mais leve, organizado e seguro. Este checklist ajuda você a verificar se já tem o essencial para avançar no divórcio consensual em cartório (via Escritura Pública). Se algo ainda faltar, não tem problema: eu te mostro o próximo passo mais seguro.
            </p>
          </div>

          {/* Checklist Items */}
          <div className="space-y-6">
            {['elegibilidade', 'documentos', 'filhos', 'patrimonio', 'alimentos', 'procuração'].map((category) => (
              <div key={category} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">
                  {getCategoryTitle(category)}
                </h3>
                <div className="space-y-3">
                  {getCategoryItems(category).map((item) => (
                    <div key={item.id} className="flex items-start gap-3">
                      <button
                        onClick={() => handleToggleItem(item.id)}
                        className={`flex-shrink-0 w-5 h-5 rounded border-2 transition-colors ${
                          item.checked 
                            ? 'bg-blue-600 border-blue-600' 
                            : 'border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        {item.checked && (
                          <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                      <label 
                        className="text-sm text-gray-700 leading-relaxed cursor-pointer flex-1"
                        onClick={() => handleToggleItem(item.id)}
                      >
                        {item.text}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Conclusão */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-700 text-sm leading-relaxed">
              Se você marcou "não" em algum item importante, não se preocupe. Vamos organizar isso juntos em uma consulta de "Alinhamento Inicial". Em uma única sessão, tiramos dúvidas, definimos o caminho adequado e saímos com um plano claro.
            </p>
          </div>

          {/* Aviso Legal */}
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              <strong>Aviso legal:</strong> Este material é informativo e não substitui consulta individual. Cada cartório pode ter rotinas próprias. Recomenda-se avaliação jurídica personalizada.
            </p>
          </div>
          </>
        )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
            <div className="text-center sm:text-left">
              <p className="text-sm text-gray-600">
                Consulta inicial na Sala Segura. Ambiente autenticado, acolhedor e objetivo.
              </p>
            </div>
            <div className="relative tooltip-container">
              <button
                onClick={handleAgendarAlinhamento}
                onMouseEnter={() => !isMobile && setShowTooltip(true)}
                onMouseLeave={() => !isMobile && setShowTooltip(false)}
                onTouchStart={() => isMobile && setShowTooltip(!showTooltip)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm relative"
              >
                AGENDAR ALINHAMENTO INICIAL
                {isMobile && (
                  <span className="ml-2 text-xs opacity-75">ℹ️</span>
                )}
              </button>
              
              {/* Tooltip */}
              <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg transition-all duration-200 pointer-events-none whitespace-nowrap z-10 ${
                isMobile 
                  ? showTooltip ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                  : 'opacity-0 group-hover:opacity-100'
              }`}>
                <div className="text-center">
                  <div className="font-semibold mb-1">⚠️ Vagas Limitadas</div>
                  <div>Restam <span className="text-yellow-300 font-bold">3 vagas</span> essa semana</div>
                  <div className="text-blue-300 mt-1">Agendar agora</div>
                  {isMobile && (
                    <div className="text-gray-400 text-xs mt-1">Toque novamente para fechar</div>
                  )}
                </div>
                
                {/* Seta do tooltip */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

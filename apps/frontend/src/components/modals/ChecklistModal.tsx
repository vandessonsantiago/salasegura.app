'use client';

import { useState, useEffect, useCallback } from 'react';
import { useChecklist, type ChecklistItem } from '@/contexts/ChecklistContext';

interface ChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChecklistModal({ isOpen, onClose }: ChecklistModalProps) {
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

  // Criar ou carregar sessão quando o modal abre
  useEffect(() => {
    if (!isOpen || loading) return;
    const timer = setTimeout(async () => {
      try {
        if (!currentSession) {
          const existing = sessions.find(s => s.title.includes('Checklist'));
          if (existing) {
            try {
              await loadSession(existing.id);
            } catch (sessionError) {
              console.warn('Sessão não encontrada, criando nova:', sessionError);
              // Se a sessão não existe, criar uma nova
              await createSession();
            }
          } else if (sessions.length === 0) {
            await createSession();
          }
        }
      } catch (err) {
        console.error('Erro ao inicializar checklist:', err);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [isOpen, currentSession, sessions, loading, createSession, loadSession]);

  // Sincronizar itens locais quando a sessão muda
  useEffect(() => {
    if (currentSession?.items) {
      setLocalItems(currentSession.items);
    }
  }, [currentSession?.id]); // Dependência apenas do ID para evitar loops

  // Função para sincronizar estado local com servidor
  const syncWithServer = useCallback(async () => {
    if (!currentSession) return;
    try {
      const freshSession = await loadSession(currentSession.id);
      if (freshSession) {
        setLocalItems(freshSession.items);
      }
    } catch (error) {
      console.error('Erro ao sincronizar com servidor:', error);
    }
  }, [currentSession, loadSession]);

  const handleToggleItem = async (itemId: string) => {
    if (!currentSession || loading) return;

    // Encontrar o item usando o ID correto
    const item = localItems.find(i => i.id === itemId);
    if (!item) {
      console.warn('Item não encontrado:', itemId);
      return;
    }

    const newChecked = !item.checked;

    // Atualização otimista do estado local
    setLocalItems(prev => prev.map(it => it.id === itemId ? { ...it, checked: newChecked } : it));

    try {
      // Tentar atualizar no servidor
      const success = await updateItem(currentSession.id, item.item_id, newChecked);

      if (!success) {
        // Se falhou, reverter a mudança local e tentar sincronizar
        console.warn('Falha ao atualizar item no servidor, revertendo e sincronizando');
        setLocalItems(prev => prev.map(it => it.id === itemId ? { ...it, checked: !newChecked } : it));
        await syncWithServer();
      }
    } catch (error) {
      // Em caso de erro, reverter a mudança local e sincronizar
      console.error('Erro ao atualizar item:', error);
      setLocalItems(prev => prev.map(it => it.id === itemId ? { ...it, checked: !newChecked } : it));
      await syncWithServer();
    }
  };

  const getProgress = () => {
    if (!currentSession) return 0;
    return Math.round((currentSession.progress / currentSession.total_items) * 100);
  };

  const getCategoryTitle = (category: string) => {
    const titles: Record<string, string> = {
      elegibilidade_procedimento: 'Categoria 1 – Elegibilidade e Procedimento',
      documentos_pessoais: 'Categoria 2 – Documentos Pessoais e de Habilitação',
      filhos_maiores: 'Categoria 3 – Filhos Maiores e Dependentes',
      patrimonio_financas: 'Categoria 4 – Patrimônio, Dívidas e Finanças',
      tributacao_custos: 'Categoria 5 – Tributação e Custos',
      alimentos_obrigacoes: 'Categoria 6 – Alimentos, Compensações e Obrigações',
      nome_comunicacoes: 'Categoria 7 – Nome e Comunicações Oficiais',
      execucao_partilha: 'Categoria 8 – Imóveis e Veículos: Execução da Partilha',
      minuta_cartorio: 'Categoria 9 – Minuta, Cartório e Assinaturas',
      clausulas_finais: 'Categoria 10 – Cláusulas Finais e Pós-Averbação'
    };
    return titles[category] || category;
  };

  const getCategoryItems = (category: string) => localItems.filter(i => i.category === category);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={handleBackdropClick}>
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden shadow-2xl transform transition-all duration-300 scale-100">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Checklist "Você está pronto(a) para o cartório?"</h2>
              <p className="text-gray-600 mt-2">Pronto(a) para a Escritura de Divórcio Consensual?</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-600 mb-3">
              <span className="font-medium">Progresso: {getProgress()}%</span>
              <span>{currentSession?.progress || 0} de {currentSession?.total_items || 0} itens concluídos</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${getProgress()}%` }}
              ></div>
            </div>
          </div>
        </div>
        <div className="overflow-y-auto max-h-[60vh] px-8 py-6">
          {error ? (
            <div className="text-center py-12">
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md mx-auto">
                <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-red-700 font-semibold mb-2">Erro ao carregar checklist</p>
                <p className="text-red-600 text-sm mb-4">{error}</p>
                <button
                  onClick={() => { clearError(); window.location.reload(); }}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          ) : loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 font-medium">Carregando checklist...</p>
            </div>
          ) : (
            <>
              <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <p className="text-gray-700 text-sm leading-relaxed">Queremos tornar este momento mais leve, organizado e seguro. Este checklist ajuda você a verificar se já tem o essencial para avançar no divórcio consensual em cartório (via Escritura Pública). Se algo ainda faltar, não tem problema: eu te mostro o próximo passo mais seguro.</p>
              </div>
              <div className="space-y-8">
                {[
                  'elegibilidade_procedimento',
                  'documentos_pessoais',
                  'filhos_maiores',
                  'patrimonio_financas',
                  'tributacao_custos',
                  'alimentos_obrigacoes',
                  'nome_comunicacoes',
                  'execucao_partilha',
                  'minuta_cartorio',
                  'clausulas_finais'
                ].map(cat => {
                  const items = getCategoryItems(cat);
                  if (items.length === 0) return null;
                  return (
                    <div key={cat} className="bg-gray-50/50 rounded-xl p-6 border border-gray-100">
                      <h3 className="font-semibold text-gray-900 mb-4 text-base flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        {getCategoryTitle(cat)}
                      </h3>
                      <div className="space-y-3">
                        {items.map(item => (
                          <div key={`item-${item.id}-${item.checked}`} className="flex items-start gap-4">
                            <button
                              onClick={() => handleToggleItem(item.id)}
                              disabled={loading}
                              className={`flex-shrink-0 w-5 h-5 rounded border-2 transition-all duration-200 ${
                                item.checked
                                  ? 'bg-blue-600 border-blue-600'
                                  : 'border-gray-300 hover:border-blue-400'
                              } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              {item.checked && (
                                <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </button>
                            <label
                              className={`text-sm text-gray-700 leading-relaxed flex-1 transition-colors duration-200 ${
                                loading ? 'cursor-not-allowed' : 'cursor-pointer'
                              }`}
                              onClick={() => !loading && handleToggleItem(item.id)}
                            >
                              {item.text}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 p-6 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-200">
                <p className="text-gray-700 text-sm leading-relaxed">Se você marcou "não" em algum item importante, não se preocupe. Vamos organizar isso juntos em uma consulta de "Alinhamento Inicial". Em uma única sessão, tiramos dúvidas, definimos o caminho adequado e saímos com um plano claro.</p>
              </div>
              <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl">
                <p className="text-xs text-yellow-800"><strong>Aviso legal:</strong> Este material é informativo e não substitui consulta individual. Cada cartório pode ter rotinas próprias. Recomenda-se avaliação jurídica personalizada.</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

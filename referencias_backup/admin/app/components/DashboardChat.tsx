'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useDashboardChat, type ChatMessage } from '../../hooks/useDashboardChat';
import { useAdminChatStorage, type ChatSession } from '../../hooks/useAdminChatStorage';
import { useChatSessions } from '../../contexts/ChatSessionsContext';
import { useChecklist } from '../../contexts/ChecklistContext';
import { useAgendamentos } from '../../contexts/AgendamentosContext';
import TypingAnimation from './TypingAnimation';
import ThinkingAnimation from './ThinkingAnimation';
import MessageBlock from './MessageBlock';
import ChecklistModal from './ChecklistModal';
import AgendamentoCard from './AgendamentoCard';
import AgendamentoModal from './AgendamentoModal';
import { constants } from '../constants';
import { useAuth } from '../../contexts/AuthContext';

interface DashboardChatProps {
  isChatStarted: boolean;
  onChatStart: () => void;
  selectedSession?: ChatSession | null;
}

export default function DashboardChat({ isChatStarted, onChatStart, selectedSession }: DashboardChatProps) {
  const { messages, loading, error, sendMessage, addUserMessage, addAssistantMessage, clearChat } = useDashboardChat();
  const { createSession, addMessageToSession, generateSessionTitle, loadSessions, getSessionMessages } = useAdminChatStorage();
  const { refreshSessions } = useChatSessions();
  const { sessions: checklistSessions, loading: checklistLoading, loadSession } = useChecklist();
  const { hasConsultas } = useAgendamentos();
  
  // Debug: Verificar estado do checklist
  useEffect(() => {
    console.log('📋 Debug - Estado do checklist:');
    console.log('📋 Sessões:', checklistSessions?.length || 0);
    console.log('📋 Loading:', checklistLoading);
  }, [checklistSessions, checklistLoading]);
  const { user } = useAuth();
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<ChatMessage | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);

  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const hasAddedMessage = useRef(false);

  // Debug: Verificar estado da autenticação
  useEffect(() => {
    console.log('🔍 Debug - Estado da autenticação:');
    console.log('👤 User:', user);
    console.log('🔑 Token no localStorage:', localStorage.getItem('supabase.auth.token'));
    console.log('🔑 Access token:', user?.access_token);
  }, [user]);

  // Carregar mensagens quando uma sessão é selecionada
  useEffect(() => {
    if (selectedSession && selectedSession.id) {
      console.log('📂 Carregando mensagens da sessão:', selectedSession.id);
      setCurrentSessionId(selectedSession.id);
      loadSessionMessages(selectedSession.id);
    }
  }, [selectedSession]);

  // Função para carregar mensagens de uma sessão
  const loadSessionMessages = async (sessionId: string) => {
    try {
      const sessionMessages = await getSessionMessages(sessionId);
      console.log('📨 Mensagens carregadas:', sessionMessages);
      
      // Limpar mensagens atuais
      clearChat();
      
      // Adicionar mensagens da sessão
      sessionMessages.forEach((msg: any) => {
        const chatMessage: ChatMessage = {
          id: msg.id,
          content: msg.content,
          role: msg.role as 'user' | 'assistant',
          timestamp: new Date(msg.timestamp)
        };
        
        if (msg.role === 'user') {
          addUserMessage(chatMessage);
        } else {
          addAssistantMessage(chatMessage);
        }
      });
    } catch (error) {
      console.error('❌ Erro ao carregar mensagens da sessão:', error);
    }
  };

  // Limpar estado quando volta ao início
  useEffect(() => {
    if (!isChatStarted) {
      console.log('🔄 Voltando ao início - limpando estado');
      clearChat();
      setInputValue('');
      setIsThinking(false);
      setIsTyping(false);
      setPendingMessage(null);
      setCurrentSessionId(null);
      hasAddedMessage.current = false;
    }
  }, [isChatStarted, clearChat]);



  // Auto-scroll para a última mensagem
  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 50);
    }
  }, []);

  // Scroll automático quando novas mensagens são adicionadas
  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking, isTyping, scrollToBottom]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || loading || isThinking || isTyping) return;

    const message = inputValue;
    setInputValue('');
    
    // Reset flag para nova mensagem
    hasAddedMessage.current = false;
    
    // Criar e adicionar mensagem do usuário
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: message.trim(),
      role: 'user',
      timestamp: new Date()
    };
    addUserMessage(userMessage);
    
    // Se é a primeira mensagem, iniciar chat e criar sessão
    if (!isChatStarted) {
      onChatStart();
      
      // Criar sessão no banco
      const title = generateSessionTitle(message);
      const sessionId = await createSession(title, message);
      if (sessionId) {
        setCurrentSessionId(sessionId);
        // Notificar o contexto para atualizar automaticamente
        await refreshSessions();
      }
    } else if (currentSessionId) {
      // Adicionar mensagem à sessão existente
      await addMessageToSession(currentSessionId, 'user', message);
    }
    
    // Iniciar animação de "pensando"
    setIsThinking(true);
    
    try {
      // Criar chatHistory atualizado incluindo a mensagem do usuário
      const updatedChatHistory = [...messages, userMessage];
      
      // Enviar mensagem e obter resposta
      const assistantMessage = await sendMessage(message, updatedChatHistory);
      
      if (assistantMessage) {
        // Armazenar a mensagem temporariamente para usar na animação
        setPendingMessage(assistantMessage);
        
        // Transição suave: parar pensamento e iniciar digitação simultaneamente
        setIsThinking(false);
        setIsTyping(true);
      } else {
        // Se não há resposta, parar a animação de pensamento
        setIsThinking(false);
      }
      
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setIsThinking(false);
    }
  };

  // Função para lidar com o término da animação de digitação
  const handleTypingComplete = useCallback(() => {
    console.log('🎬 handleTypingComplete chamado');
    console.log('📝 pendingMessage:', pendingMessage);
    console.log('🔒 hasAddedMessage:', hasAddedMessage.current);
    
    if (pendingMessage && !hasAddedMessage.current) {
      hasAddedMessage.current = true;
      
      // Adicionar mensagem do assistente
      addAssistantMessage(pendingMessage);
      
      // Salvar mensagem do assistente na sessão
      if (currentSessionId) {
        addMessageToSession(currentSessionId, 'assistant', pendingMessage.content).then(() => {
          // Notificar o contexto para atualizar automaticamente
          refreshSessions();
        });
      }
      
      // Limpar estados
      setPendingMessage(null);
      setIsTyping(false);
    }
  }, [pendingMessage, addAssistantMessage, currentSessionId, addMessageToSession, refreshSessions]);

  // Função para lidar com o progresso da animação de digitação
  const handleTypingProgress = useCallback(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  // Função para lidar com edição de mensagem
  const handleEditMessage = useCallback((messageId: string, newContent: string) => {
    console.log('✏️ Editando mensagem:', messageId, newContent);
    // Implementar lógica de edição se necessário
  }, []);

  // Função para lidar com refazer mensagem
  const handleRefazerMessage = useCallback((messageId: string) => {
    console.log('🔄 Refazendo mensagem:', messageId);
    // Implementar lógica de refazer se necessário
  }, []);

  // Função para lidar com cópia de mensagem
  const handleCopyMessage = useCallback((content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopyFeedback('Mensagem copiada!');
      setTimeout(() => setCopyFeedback(null), 2000);
    });
  }, []);

  // Função para abrir o modal do checklist
  // Calcular progresso do checklist
  const getChecklistProgress = useCallback(() => {
    if (!checklistSessions || checklistSessions.length === 0) {
      return { progress: 0, total: 20, percentage: 0 };
    }
    
    // Pegar a sessão mais recente
    const latestSession = checklistSessions[0];
    if (!latestSession) {
      return { progress: 0, total: 20, percentage: 0 };
    }
    
    const percentage = Math.round((latestSession.progress / latestSession.total_items) * 100);
    
    return {
      progress: latestSession.progress,
      total: latestSession.total_items,
      percentage
    };
  }, [checklistSessions]);

  // Carregar sessão mais recente quando abrir o modal
  const handleOpenChecklist = useCallback(async () => {
    console.log('🔍 Abrindo checklist - Sessões disponíveis:', checklistSessions?.length || 0);
    
    if (checklistSessions && checklistSessions.length > 0 && loadSession) {
      // Se há sessões, carregar a mais recente
      const latestSession = checklistSessions[0];
      if (latestSession) {
        console.log('📋 Carregando sessão mais recente:', latestSession.id);
        await loadSession(latestSession.id);
      }
    } else {
      console.log('📋 Nenhuma sessão existente, será criada nova');
    }
    
    console.log('📋 Abrindo modal do checklist');
    setIsChecklistModalOpen(true);
  }, [checklistSessions, loadSession]);

  // Funções para controlar modal de agendamento


  return (
    <>
      {/* Main Content - Chat Area */}
      <main className="flex-1 flex flex-col bg-gray-50">
        {/* Chat Container com Scroll - Altura fixa para chat */}
        <div 
          ref={chatContainerRef}
          className="h-[calc(100vh-64px-150px)] overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
        >
                      <div className="w-full max-w-2xl mx-auto">
              {messages.length === 0 ? (
                <div className="text-center mt-8">

                  
                  {/* Card de Agendamento */}
                  <AgendamentoCard />

                {/* Banner Checklist */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-lg mx-auto shadow-sm relative">
                  {/* Etiqueta Gratuito */}
                  <div className="absolute -top-3 -left-6 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold px-4 py-2 rounded-lg shadow-lg border-2 border-white w-24">
                    <div className="text-center">
                      <div className="text-xs font-bold">GRATUITO</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <img 
                          src="/lista.png" 
                          alt="Lista" 
                          className="w-6 h-6" 
                        />
                      </div>
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="text-base font-semibold text-gray-900 mb-1">
                        Checklist "Você está pronto(a) para o cartório?"
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Confira os documentos necessários para o divórcio extrajudicial.
                      </p>
                      
                      {/* Barra de Progresso */}
                      {(() => {
                        const progress = getChecklistProgress();
                        if (progress.progress > 0) {
                          return (
                            <div className="mb-3">
                              <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>Progresso: {progress.percentage}%</span>
                                <span>{progress.progress} de {progress.total} itens</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${progress.percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                      
                      <button 
                        onClick={handleOpenChecklist}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        {getChecklistProgress().progress > 0 ? 'CONTINUAR CHECKLIST' : 'ACESSAR AGORA'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <MessageBlock
                  key={message.id}
                  message={{
                    id: message.id,
                    type: message.role === 'user' ? 'user' : 'assistant',
                    content: message.content,
                    timestamp: message.timestamp
                  }}
                  onEdit={handleEditMessage}
                  onRefazer={handleRefazerMessage}
                  onCopy={handleCopyMessage}
                />
              ))
            )}

            {/* Animação de pensando */}
            {isThinking && (
              <div className="flex justify-start">
                <div className="text-gray-900">
                  <ThinkingAnimation onComplete={() => setIsThinking(false)} />
                </div>
              </div>
            )}

            {/* Animação de digitação */}
            {isTyping && pendingMessage && (
              <div className="flex justify-start">
                <div className="text-gray-900 w-full leading-relaxed">
                  <TypingAnimation
                    text={pendingMessage.content}
                    speed={40}
                    onComplete={handleTypingComplete}
                    onProgress={handleTypingProgress}
                    className="px-4 py-3"
                  />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex justify-start">
                <div className="bg-red-50 border border-red-200 text-red-800 max-w-xs lg:max-w-md px-4 py-3 rounded-lg">
                  <p className="text-sm">Erro: {error}</p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>

      {/* Footer - Input Fixo */}
      <footer className="bg-gray-50 p-4 flex-shrink-0">
        <div className="w-full max-w-2xl mx-auto">
          {/* Texto de boas-vindas quando não há mensagens */}
          {messages.length === 0 && (
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-lg font-medium text-gray-900">{constants.chat.welcomeTitle}</p>
              </div>
              <p className="text-sm text-gray-500">{constants.chat.welcomeSubtitle}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={constants.chat.placeholder}
                className="w-full bg-gray-200 text-gray-900 px-4 py-3 pr-12 rounded-full placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400"
                disabled={loading || isThinking || isTyping}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || loading || isThinking || isTyping}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-gray-800 hover:bg-gray-900 rounded-full flex items-center justify-center transition-colors disabled:bg-gray-300 disabled:hover:bg-gray-300"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </footer>

      {/* Feedback de cópia */}
      {copyFeedback && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {copyFeedback}
        </div>
      )}

      {/* Modal do Checklist */}
      <ChecklistModal 
        isOpen={isChecklistModalOpen}
        onClose={() => setIsChecklistModalOpen(false)}

      />


      

    </>
  );
}

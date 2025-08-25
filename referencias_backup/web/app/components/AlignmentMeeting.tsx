'use client';

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import SettingsModal from "./SettingsModal";
import MessageModal from "./MessageModal";
import TypingAnimation from "./TypingAnimation";
import ThinkingAnimation from "./ThinkingAnimation";
import MessageBlock from "./MessageBlock";

import { useChatStorage, ChatSession } from "../hooks/useChatStorage";
import { constants } from "../constants";

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  conversionData?: {
    shouldConvert?: boolean;
    emailExists?: boolean;
    userEmail?: string;
    userName?: string;
    contactData?: any;
  };
}

interface ContactData {
  name: string;
  email: string;
  whatsapp: string;
}

export default function AlignmentMeeting() {
  const [message, setMessage] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [isChatStarted, setIsChatStarted] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [pendingMessage, setPendingMessage] = useState<ChatMessage | null>(null);
  const [currentFlow, setCurrentFlow] = useState<'free' | 'primeiros-passos' | 'suporte' | 'sac'>('free');
  const [conversionData, setConversionData] = useState<any>(null);

  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { createSession, updateSession } = useChatStorage();

  // Auto-scroll para a última mensagem
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 50);
    }
  };

  // Scroll automático quando novas mensagens são adicionadas
  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isThinking, isTyping]);

  // Monitorar mudanças no conversionData
  useEffect(() => {
    if (conversionData === null) {
      console.log('🔄 conversionData limpo - conversão processada com sucesso');
    } else if (conversionData) {
      console.log('🔄 conversionData definido:', conversionData);
    }
  }, [conversionData]);



  // Função para abrir formulário de conversão
  const openContactForm = () => {
    console.log('🎯 Abrindo formulário de contato...');
    setTimeout(() => {
              // Formulário será exibido na mensagem do chat
    }, 1000);
  };

  // Scroll durante a animação de digitação
  const handleTypingProgress = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  // Função para lidar com o término da animação de digitação
  const handleTypingComplete = () => {
    console.log('🎬 handleTypingComplete chamado');
    console.log('📝 pendingMessage:', pendingMessage);
    
    if (pendingMessage) {
      const updatedMessages = [...chatMessages, pendingMessage];
      setChatMessages(updatedMessages);
      setPendingMessage(null);
      setIsTyping(false);
      
      // Salvar sessão atualizada
      if (currentSessionId) {
        updateSession(currentSessionId, updatedMessages);
      }
      
      // Verificar se deve mostrar o formulário
      console.log('🔍 Verificando conversão:', {
        conversionData: pendingMessage.conversionData,
        shouldConvert: pendingMessage.conversionData?.shouldConvert
      });
      
              if (pendingMessage.conversionData?.shouldConvert === true) {
          console.log('✅ Conversão detectada - formulário será exibido na mensagem');
      } else {
        console.log('❌ Não há conversão detectada');
      }
    } else {
      console.log('❌ Nenhuma pendingMessage encontrada');
    }
  };

  // Funções para lidar com ações dos blocos de mensagem
  const handleEditMessage = async (id: string, newContent: string) => {
    // Atualizar a mensagem editada
    const updatedChatMessages = chatMessages.map(msg => 
      msg.id === id ? { ...msg, content: newContent } : msg
    );
    
    // Encontrar o índice da mensagem editada
    const messageIndex = chatMessages.findIndex(msg => msg.id === id);
    
    console.log('🔧 Editando mensagem:', {
      messageId: id,
      newContent,
      messageIndex,
      totalMessages: chatMessages.length
    });
    
    // Se a mensagem editada é do usuário, refazer a resposta do agente
    const editedMessage = updatedChatMessages[messageIndex];
    if (editedMessage && editedMessage.type === 'user') {
      // Remover TODAS as mensagens que se seguiram à edição (usuário e agente)
      const messagesBeforeEdit = updatedChatMessages.slice(0, messageIndex + 1);
      const removedMessagesCount = updatedChatMessages.length - messagesBeforeEdit.length;
      
      console.log('🗑️ Removendo mensagens subsequentes:', {
        removedCount: removedMessagesCount,
        remainingMessages: messagesBeforeEdit.length,
        messagesRemoved: updatedChatMessages.slice(messageIndex + 1).map(m => ({ id: m.id, type: m.type }))
      });
      
      setChatMessages(messagesBeforeEdit);
      
      // Limpar dados de conversão quando mensagens são removidas
      console.log('🧹 Limpando dados de conversão...');
      setConversionData(null);
      
      // Salvar sessão atualizada
      if (currentSessionId) {
        updateSession(currentSessionId, messagesBeforeEdit);
      }
      
      // Reenviar a mensagem editada para obter nova resposta
      console.log('🔄 Gerando nova resposta para mensagem editada...');
      setIsThinking(true);
      
      try {
        // Usar a API do backend
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
        const response = await fetch(`${apiUrl}/api/v1/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
                  body: JSON.stringify({
          message: newContent,
          chatHistory: messagesBeforeEdit.slice(0, -1), // Excluir a mensagem atual do histórico
          language: 'pt-BR'
        }),
        });

        if (!response.ok) {
          throw new Error('Erro na API');
        }

        const data = await response.json();
        
        // Armazenar dados de conversão se houver
        if (data.conversionData) {
          setConversionData(data.conversionData);
        }
        
        // A mensagem será adicionada quando a animação terminar
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: data.response,
          timestamp: new Date(),
          conversionData: data.conversionData
        };
        
        // Armazenar a mensagem temporariamente para usar na animação
        setPendingMessage(assistantMessage);
        
        // Transição suave: parar pensamento e iniciar digitação simultaneamente
        setIsThinking(false);
        setIsTyping(true);
        
      } catch (error) {
        console.error('Erro ao refazer resposta após edição:', error);
        setIsThinking(false);
        
        // Mensagem de erro
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
                  content: 'Desculpe, ocorreu um erro ao processar a mensagem editada. Por favor, tente novamente.',
          timestamp: new Date()
        };
        
        setChatMessages(prev => [...prev, errorMessage]);
      }
    } else {
      // Se a mensagem editada não é do usuário, apenas atualizar
      setChatMessages(updatedChatMessages);
      
      // Salvar sessão atualizada
      if (currentSessionId) {
        updateSession(currentSessionId, updatedChatMessages);
      }
    }
  };

  const handleRefazerMessage = async (id: string) => {
    const messageToRefazer = chatMessages.find(msg => msg.id === id);
    if (!messageToRefazer) return;

    // Remover a mensagem do assistente e todas as mensagens subsequentes
    const messageIndex = chatMessages.findIndex(msg => msg.id === id);
    const updatedChatMessages = chatMessages.slice(0, messageIndex);
    setChatMessages(updatedChatMessages);

    // Reenviar a última mensagem do usuário
    const lastUserMessage = updatedChatMessages
      .reverse()
      .find(msg => msg.type === 'user');

    if (lastUserMessage) {
      // Iniciar animação de pensamento
      setIsThinking(true);
      
      try {
        // Usar a API do backend
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
        const response = await fetch(`${apiUrl}/api/v1/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
                  body: JSON.stringify({
          message: lastUserMessage.content,
          chatHistory: updatedChatMessages,
          language: 'pt-BR'
        }),
        });

        if (!response.ok) {
          throw new Error('Erro na API');
        }

        const data = await response.json();
        
        // Armazenar dados de conversão se houver
        if (data.conversionData) {
          setConversionData(data.conversionData);
        }
        
        // A mensagem será adicionada quando a animação terminar
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: data.response,
          timestamp: new Date()
        };
        
        // Armazenar a mensagem temporariamente para usar na animação
        setPendingMessage(assistantMessage);
        
        // Transição suave: parar pensamento e iniciar digitação simultaneamente
        setIsThinking(false);
        setIsTyping(true);
        
      } catch (error) {
        console.error('Erro ao refazer mensagem:', error);
        setIsThinking(false);
        
        // Mensagem de erro
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
                  content: 'Desculpe, ocorreu um erro ao refazer a resposta. Por favor, tente novamente.',
          timestamp: new Date()
        };
        
        setChatMessages(prev => [...prev, errorMessage]);
      }
    }
  };



  const handleCopyMessage = (content: string) => {
    setCopyFeedback('Mensagem copiada!');
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  // Função para carregar uma sessão salva
  const handleLoadSession = (session: ChatSession) => {
    setIsChatStarted(true);
    setCurrentFlow(session.flow);
    setChatMessages(session.messages);
    setCurrentSessionId(session.id);
    setMessage("");
  };

  // Função para lidar com o envio do formulário de contato
  const handleContactSubmit = async (contactData: ContactData) => {
    try {
      // 1. Enviar dados para a API de conversões do backend
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
      const response = await fetch(`${apiUrl}/api/v1/conversions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactData),
      });

      const result = await response.json();

      // Verificar se o email já está cadastrado
      if (result.emailExists) {
        console.log('✅ Email já cadastrado detectado:', contactData.email);
        
        // Mensagem para email já cadastrado com botões interativos
        const emailExistsMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: `Olá, ${contactData.name}! 

📧 **Email já cadastrado:** ${contactData.email}

Vejo que você já possui uma conta na Sala Segura! Isso significa que você já concluiu seu cadastro anteriormente.

🎯 **O que fazer agora:**

Escolha uma das opções abaixo:`,
          timestamp: new Date(),
          conversionData: {
            emailExists: true,
            userEmail: contactData.email,
            userName: contactData.name
          }
        };
        
        setChatMessages(prev => [...prev, emailExistsMessage]);
        setConversionData(null);
        return;
      }

      if (!result.success) {
        throw new Error(result.error || 'Erro ao processar formulário');
      }

      // 2. Mensagem de sucesso personalizada
      const successMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Perfeito, ${contactData.name}! 

✅ Seu **acesso à Sala Segura** foi criado com sucesso!

📧 **Email de acesso:** ${contactData.email}

🎯 **Próximos passos:**
1. Você será redirecionado para criar sua senha
2. Após criar a senha, terá acesso completo à Sala Segura
3. Poderá organizar todos os processos do divórcio
4. Terá acesso a checklists, documentos e acompanhamento

🔒 Todos os seus dados estão seguros e serão tratados com total confidencialidade.

Obrigado por escolher nosso escritório para conduzir esse processo importante de forma humanizada e organizada. Estamos aqui para ajudar!`,
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, successMessage]);
      setConversionData(null);
      
      // 3. Redirecionar para a página de registro
      setTimeout(() => {
        window.location.href = result.redirectUrl;
      }, 3000);
      
      // 4. Log de sucesso
      console.log('✅ Cadastro processado com sucesso:', {
        name: contactData.name,
        email: contactData.email,
        redirectUrl: result.redirectUrl
      });
      
    } catch (error) {
      console.error('❌ Erro ao processar formulário:', error);
      
      // 5. Mensagem de erro amigável
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Desculpe, ${contactData.name}, ocorreu um erro técnico ao processar seu formulário.

Por favor, tente novamente ou entre em contato diretamente pelo WhatsApp para que eu possa ajudá-lo pessoalmente.

Obrigado pela compreensão!`,
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, errorMessage]);
      setConversionData(null);
    }
  };

  // Função para iniciar chat livre
  const handleStartFreeChat = async (userMessage: string) => {
    setIsChatStarted(true);
    setCurrentFlow('free');
    
    // Criar nova sessão
    const sessionId = createSession('free', userMessage);
    setCurrentSessionId(sessionId);
    
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    
    setChatMessages([userMsg]);
    setMessage(""); // Limpar o input
    setIsThinking(true);
    
    try {
      // Usar a API do backend
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
      const response = await fetch(`${apiUrl}/api/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          chatHistory: []
        }),
      });

      if (!response.ok) {
        throw new Error('Erro na API');
      }

      const data = await response.json();
      
      // Armazenar dados de conversão se houver
      if (data.conversionData) {
        setConversionData(data.conversionData);
      }
      
      // A mensagem será adicionada quando a animação terminar
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.response,
        timestamp: new Date()
      };
      
      // Armazenar a mensagem temporariamente para usar na animação
      setPendingMessage(assistantMessage);
      
      // Transição suave: parar pensamento e iniciar digitação simultaneamente
      setIsThinking(false);
      setIsTyping(true);
      
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setIsThinking(false);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.',
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, errorMessage]);
    }
  };

  // Função para iniciar fluxo guiado
  const handleStartGuidedFlow = async (flow: 'primeiros-passos' | 'suporte' | 'sac') => {
    setIsChatStarted(true);
    setCurrentFlow(flow);
    
    let flowMessage = '';
    
    switch (flow) {
      case 'primeiros-passos':
        flowMessage = 'Quero iniciar os Primeiros Passos';
        break;
      case 'suporte':
        flowMessage = 'Preciso de suporte técnico';
        break;
      case 'sac':
        flowMessage = 'Quero falar com o SAC';
        break;
    }
    
    // Criar nova sessão
    const sessionId = createSession(flow, flowMessage);
    setCurrentSessionId(sessionId);
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: flowMessage,
      timestamp: new Date()
    };
    
    setChatMessages([userMessage]);
    setIsThinking(true);
    
    try {
      // Usar a API do backend para aproveitar o sistema de conversão e blocos de mensagem
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
      const response = await fetch(`${apiUrl}/api/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: flowMessage,
          chatHistory: []
        }),
      });

      if (!response.ok) {
        throw new Error('Erro na API');
      }

      const data = await response.json();
      
      // Armazenar dados de conversão se houver
      if (data.conversionData) {
        setConversionData(data.conversionData);
      }
      
      // A mensagem será adicionada quando a animação terminar
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.response,
        timestamp: new Date()
      };
      
      // Armazenar a mensagem temporariamente para usar na animação
      setPendingMessage(assistantMessage);
      
      // Transição suave: parar pensamento e iniciar digitação simultaneamente
      setIsThinking(false);
      setIsTyping(true);
      
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setIsThinking(false);
      
      // Fallback para mensagens estáticas em caso de erro
      let fallbackResponse = '';
      switch (flow) {
        case 'primeiros-passos':
          fallbackResponse = constants.chat.welcomeMessage;
          break;
        case 'suporte':
          fallbackResponse = constants.chat.supportMessage;
          break;
        case 'sac':
          fallbackResponse = constants.chat.sacMessage;
          break;
      }
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: fallbackResponse,
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleSendMessage = async () => {
    if (message.trim()) {
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'user',
        content: message,
        timestamp: new Date()
      };
      
      const updatedMessages = [...chatMessages, userMessage];
      setChatMessages(updatedMessages);
      setMessage("");
      
      // Salvar sessão atualizada
      if (currentSessionId) {
        updateSession(currentSessionId, updatedMessages);
      }
      
      // Iniciar animação de pensamento
      setIsThinking(true);
      
      try {
        // Usar a API do backend
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
        const response = await fetch(`${apiUrl}/api/v1/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
                  body: JSON.stringify({
          message: message,
          chatHistory: chatMessages,
          language: 'pt-BR'
        }),
        });

        if (!response.ok) {
          throw new Error('Erro na API');
        }

        const data = await response.json();
        
        // Armazenar dados de conversão se houver
        if (data.conversionData) {
          setConversionData(data.conversionData);
        }
        
        // A mensagem será adicionada quando a animação terminar
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: data.response,
          timestamp: new Date(),
          conversionData: data.conversionData || null
        };
        
        console.log('📝 Mensagem criada:', {
          id: assistantMessage.id,
          conversionData: assistantMessage.conversionData,
          shouldConvert: assistantMessage.conversionData?.shouldConvert
        });
        
        // Armazenar a mensagem temporariamente para usar na animação
        setPendingMessage(assistantMessage);
        
        // Transição suave: parar pensamento e iniciar digitação simultaneamente
        setIsThinking(false);
        setIsTyping(true);
        
      } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        setIsThinking(false);
        
        // Mensagem de erro
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.',
          timestamp: new Date()
        };
        
        setChatMessages(prev => [...prev, errorMessage]);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      
      // Se o chat não foi iniciado, iniciar chat livre
      if (!isChatStarted) {
        handleStartFreeChat(message);
      } else {
        handleSendMessage();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col font-instrument-sans">
      {/* Header */}
      <header className="flex justify-between items-start p-4 flex-shrink-0">
        {/* Avatar - aparece no canto superior esquerdo quando chat iniciado */}
        {isChatStarted && (
          <div className="flex-shrink-0">
            <button
              onClick={() => {
                setIsChatStarted(false);
                setChatMessages([]);
                setPendingMessage(null);
                setIsThinking(false);
                setIsTyping(false);
                        setConversionData(null);
                setCurrentFlow('free');
                setCurrentSessionId(null);
              }}
              className="hover:opacity-80 transition-opacity cursor-pointer"
            >
              <Image
                src="/logotipo-salasegura.svg"
                alt="Sala Segura"
                width={120}
                height={40}
                className="h-8 w-auto object-contain dark:invert dark:brightness-0 dark:contrast-200"
              />
            </button>
          </div>
        )}
        
        {/* Icons no canto superior direito */}
        <div className="flex gap-4 ml-auto">
          <button 
            onClick={() => setIsMessageOpen(true)}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <Image
              src="/icon-message.svg"
              alt="Chat"
              width={24}
              height={24}
              className="w-6 h-6 dark:invert dark:brightness-0 dark:contrast-200"
            />
          </button>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <Image
              src="/icon-settings.svg"
              alt="Configurações"
              width={24}
              height={24}
              className="w-6 h-6 dark:invert dark:brightness-0 dark:contrast-200"
            />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {!isChatStarted ? (
          // Layout inicial - antes de iniciar o chat
          <div className="text-center max-w-xl mx-auto">
            {/* Logo Principal */}
            <div>
              <Image
                src="/logotipo-salasegura.svg"
                alt="Sala Segura"
                width={200}
                height={80}
                className="w-48 h-auto mx-auto object-contain dark:invert dark:brightness-0 dark:contrast-200"
              />
            </div>


            
            <div className="flex items-center justify-center gap-2 mb-4 px-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">{constants.profile.role}</span>
              <div className="relative group overflow-visible">
                <Image
                  src="/icon-people.svg"
                  alt="Host"
                  width={16}
                  height={16}
                  className="w-4 h-4 dark:invert dark:brightness-0 dark:contrast-200 cursor-help"
                />
                <div className="absolute bottom-full right-0 mb-3 px-4 py-3 bg-gray-900 text-white text-sm rounded-xl border border-blue-400/30 shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-10 backdrop-blur-sm w-64 sm:w-80 max-w-[calc(100vw-1rem)]">
                  <div className="text-center space-y-2">
                  <div className="font-medium text-gray-200">{constants.tooltip.title}</div>
                    <div className="font-bold text-blue-300 text-xs tracking-wide uppercase">{constants.tooltip.credentials}</div>
                    
                    <div className="text-gray-300 text-xs leading-relaxed">
                      {constants.tooltip.specialization}
                    </div>
                  </div>
                  <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            </div>


          </div>
        ) : (
          // Layout do chat - após iniciar
          <div className="w-full max-w-xl mx-auto flex-1 flex flex-col">
            {/* Chat Container com Scroll - Altura ajustada para input visível */}
            <div ref={chatContainerRef} className="h-[calc(100vh-280px)] overflow-y-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                          {/* Chat Messages */}
            {chatMessages.map((msg) => (
              <MessageBlock
                key={msg.id}
                message={msg}
                onEdit={handleEditMessage}
                onRefazer={handleRefazerMessage}
                onCopy={handleCopyMessage}
                onContactSubmit={handleContactSubmit}
              />
            ))}
            

            
            {/* Thinking Animation */}
              {isThinking && (
                <div className="flex justify-start">
                  <div className="text-gray-900 dark:text-white">
                    <ThinkingAnimation onComplete={() => setIsThinking(false)} />
                  </div>
                </div>
              )}
              
              {/* Typing Animation */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="text-gray-900 dark:text-white w-full leading-relaxed">
                    <TypingAnimation 
                      text={pendingMessage?.content || ''}
                      speed={40}
                      onComplete={handleTypingComplete}
                      onProgress={handleTypingProgress}
                      className="px-4 py-3"
                    />
                  </div>
                </div>
              )}
              

            </div>
          </div>
        )}
      </main>

      {/* Message Input Area */}
      <footer className="p-4 flex-shrink-0">
        <div className="max-w-xl mx-auto">
          {/* Action Buttons - Ajustados à esquerda */}
          {!isChatStarted && (
            <div className="flex gap-2 mb-3">
              {/* Primeiros Passos Button */}
              <button 
                onClick={() => handleStartGuidedFlow('primeiros-passos')}
                className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors"
              >
                <Image
                  src="/icon-sparkles.svg"
                  alt="Primeiros Passos"
                  width={16}
                  height={16}
                  className="w-4 h-4"
                />
                {constants.cta.button}
              </button>

              {/* Suporte Button */}
              <button 
                onClick={() => handleStartGuidedFlow('suporte')}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors"
              >
                <Image
                  src="/icon-call-center.svg"
                  alt="Suporte"
                  width={16}
                  height={16}
                  className="w-4 h-4"
                />
                {constants.cta.support}
              </button>

              {/* SAC Button */}
              <button 
                onClick={() => handleStartGuidedFlow('sac')}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors"
              >
                <Image
                  src="/icon-customer-service.svg"
                  alt="SAC"
                  width={16}
                  height={16}
                  className="w-4 h-4"
                />
                {constants.cta.customerService}
              </button>
            </div>
          )}

          <div className="relative mb-3">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={!isChatStarted ? constants.chat.freeChatPlaceholder : constants.chat.placeholder}
              className="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-3 pr-12 rounded-full placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
            <button
              onClick={() => {
                if (!isChatStarted) {
                  handleStartFreeChat(message);
                } else {
                  handleSendMessage();
                }
              }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center hover:bg-teal-700 transition-colors disabled:bg-gray-300 disabled:hover:bg-gray-300"
            >
              <Image
                src="/icon-arrow-up.svg"
                alt={constants.chat.sendButton}
                width={16}
                height={16}
                className="w-4 h-4 text-white"
              />
            </button>
          </div>
          
          {/* Legal Text */}
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {constants.chat.legal}
          </p>
        </div>
      </footer>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />

      {/* Message Modal */}
              <MessageModal 
          isOpen={isMessageOpen} 
          onClose={() => setIsMessageOpen(false)}
          onLoadSession={handleLoadSession}
        />

      {/* Formulário integrado na mensagem do chat */}

      {/* Copy Feedback Toast */}
      {copyFeedback && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in">
          {copyFeedback}
        </div>
      )}
    </div>
  );
}

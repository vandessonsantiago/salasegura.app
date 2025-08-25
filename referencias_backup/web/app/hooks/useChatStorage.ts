'use client';

import { useState, useEffect, useCallback } from 'react';

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  flow: 'free' | 'primeiros-passos' | 'suporte' | 'sac';
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  conversionData?: any;
}

const STORAGE_KEY = 'sala-segura-chats';

// Evento personalizado para sincronizar mudanças
const STORAGE_EVENT = 'sala-segura-storage-updated';

export function useChatStorage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  // Função para carregar sessões do localStorage
  const loadSessions = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Converter strings de data de volta para objetos Date
        const sessionsWithDates = parsed.map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          updatedAt: new Date(session.updatedAt),
          messages: session.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setSessions(sessionsWithDates);
      } else {
        setSessions([]);
      }
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
      setSessions([]);
    }
  }, []);

  // Carregar sessões do localStorage na inicialização
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Listener para mudanças no localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      loadSessions();
    };

    // Listener para mudanças no localStorage
    window.addEventListener('storage', handleStorageChange);
    
    // Listener para evento personalizado
    window.addEventListener(STORAGE_EVENT, handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(STORAGE_EVENT, handleStorageChange);
    };
  }, [loadSessions]);

  // Salvar sessões no localStorage
  const saveSessions = (newSessions: ChatSession[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSessions));
      setSessions(newSessions);
      
      // Disparar evento personalizado para sincronizar outros componentes
      window.dispatchEvent(new CustomEvent(STORAGE_EVENT));
    } catch (error) {
      console.error('Erro ao salvar conversas:', error);
    }
  };

  // Criar nova sessão
  const createSession = (flow: 'free' | 'primeiros-passos' | 'suporte' | 'sac', initialMessage?: string): string => {
    const sessionId = Date.now().toString();
    const title = generateSessionTitle(flow, initialMessage);
    
    const newSession: ChatSession = {
      id: sessionId,
      title,
      messages: initialMessage ? [{
        id: Date.now().toString(),
        type: 'user',
        content: initialMessage,
        timestamp: new Date()
      }] : [],
      flow,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedSessions = [newSession, ...sessions];
    saveSessions(updatedSessions);
    return sessionId;
  };

  // Atualizar sessão existente
  const updateSession = (sessionId: string, messages: ChatMessage[]) => {
    const updatedSessions = sessions.map(session => {
      if (session.id === sessionId) {
        return {
          ...session,
          messages,
          updatedAt: new Date(),
          title: generateSessionTitle(session.flow, messages[0]?.content)
        };
      }
      return session;
    });
    saveSessions(updatedSessions);
  };

  // Deletar sessão
  const deleteSession = (sessionId: string) => {
    const updatedSessions = sessions.filter(session => session.id !== sessionId);
    saveSessions(updatedSessions);
  };

  // Limpar todas as sessões
  const clearAllSessions = () => {
    saveSessions([]);
  };

  // Buscar sessões
  const searchSessions = (query: string) => {
    if (!query.trim()) return sessions;
    
    return sessions.filter(session => 
      session.title.toLowerCase().includes(query.toLowerCase()) ||
      session.messages.some(msg => 
        msg.content.toLowerCase().includes(query.toLowerCase())
      )
    );
  };

  return {
    sessions,
    createSession,
    updateSession,
    deleteSession,
    clearAllSessions,
    searchSessions
  };
}

// Função para gerar título da sessão
function generateSessionTitle(flow: string, firstMessage?: string): string {
  // Detectar idioma baseado na mensagem
  const isEnglish = firstMessage ? detectLanguage(firstMessage) === 'en' : false;
  
  const flowNames = {
    'free': isEnglish ? 'Free Chat' : 'Chat Livre',
    'primeiros-passos': isEnglish ? 'First Steps' : 'Primeiros Passos',
    'suporte': isEnglish ? 'Technical Support' : 'Suporte Técnico',
    'sac': 'SAC' // Mantém SAC para ambos os idiomas
  };

  const flowName = flowNames[flow as keyof typeof flowNames] || (isEnglish ? 'Chat' : 'Chat');
  
  if (firstMessage) {
    // Limitar o título a 50 caracteres
    const truncatedMessage = firstMessage.length > 50 
      ? firstMessage.substring(0, 50) + '...' 
      : firstMessage;
    return `${flowName}: ${truncatedMessage}`;
  }

  return flowName;
}

// Função para detectar idioma baseado no texto
function detectLanguage(text: string): 'pt' | 'en' {
  const englishWords = ['the', 'and', 'to', 'of', 'a', 'in', 'is', 'it', 'you', 'that', 'he', 'was', 'for', 'on', 'are', 'as', 'with', 'his', 'they', 'at', 'be', 'this', 'have', 'from', 'or', 'one', 'had', 'by', 'word', 'but', 'not', 'what', 'all', 'were', 'we', 'when', 'your', 'can', 'said', 'there', 'use', 'an', 'each', 'which', 'she', 'do', 'how', 'their', 'if', 'will', 'up', 'other', 'about', 'out', 'many', 'then', 'them', 'these', 'so', 'some', 'her', 'would', 'make', 'like', 'into', 'him', 'time', 'has', 'two', 'more', 'go', 'no', 'way', 'could', 'my', 'than', 'first', 'been', 'call', 'who', 'its', 'now', 'find', 'long', 'down', 'day', 'did', 'get', 'come', 'made', 'may', 'part'];
  const portugueseWords = ['de', 'a', 'o', 'que', 'e', 'do', 'da', 'em', 'um', 'para', 'é', 'com', 'não', 'uma', 'os', 'no', 'se', 'na', 'por', 'mais', 'as', 'dos', 'como', 'mas', 'foi', 'ele', 'das', 'tem', 'à', 'seu', 'sua', 'ou', 'ser', 'quando', 'muito', 'há', 'nos', 'já', 'está', 'eu', 'também', 'só', 'pelo', 'pela', 'até', 'isso', 'ela', 'entre', 'era', 'depois', 'sem', 'mesmo', 'aos', 'ter', 'seus', 'suas', 'meu', 'minha', 'têm', 'naquele', 'neles', 'você', 'lhe', 'deles', 'essas', 'esses', 'pelas', 'este', 'fosse', 'dele', 'tu', 'te', 'vocês', 'vos', 'lhes', 'meus', 'minhas', 'teu', 'tua', 'teus', 'tuas', 'nosso', 'nossa', 'nossos', 'nossas', 'dela', 'delas', 'esta', 'estes', 'estas', 'aquele', 'aquela', 'aqueles', 'aquelas', 'isto', 'aquilo', 'estou', 'está', 'estamos', 'estão', 'estive', 'esteve', 'estivemos', 'estiveram', 'estava', 'estávamos', 'estavam', 'estivera', 'estivéramos', 'esteja', 'estejamos', 'estejam', 'estivesse', 'estivéssemos', 'estivessem', 'estiver', 'estivermos', 'estiverem', 'hei', 'há', 'havemos', 'hão', 'houve', 'houvemos', 'houveram', 'houvera', 'houvéramos', 'haja', 'hajamos', 'hajam', 'houvesse', 'houvéssemos', 'houvessem', 'houver', 'houvermos', 'houverem', 'houverei', 'houverá', 'houveremos', 'houverão', 'houveria', 'houveríamos', 'houveriam', 'sou', 'somos', 'são', 'era', 'éramos', 'eram', 'fora', 'fôramos', 'seja', 'sejamos', 'sejam', 'fosse', 'fôssemos', 'fossem', 'for', 'formos', 'forem', 'serei', 'será', 'seremos', 'serão', 'seria', 'seríamos', 'seriam', 'tenho', 'tem', 'temos', 'têm', 'tinha', 'tínhamos', 'tinham', 'tivera', 'tivéramos', 'tenha', 'tenhamos', 'tenham', 'tivesse', 'tivéssemos', 'tivessem', 'tiver', 'tivermos', 'tiverem', 'terei', 'terá', 'teremos', 'terão', 'teria', 'teríamos', 'teriam'];
  
  const textLower = text.toLowerCase();
  const words = textLower.split(/\s+/);
  
  let englishCount = 0;
  let portugueseCount = 0;
  
  words.forEach(word => {
    if (englishWords.includes(word)) englishCount++;
    if (portugueseWords.includes(word)) portugueseCount++;
  });
  
  return englishCount > portugueseCount ? 'en' : 'pt';
}

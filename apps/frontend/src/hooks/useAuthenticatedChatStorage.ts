import { useState, useCallback } from 'react';
import { apiEndpoint } from '@/lib/api';

export interface AuthChatConversation {
  id: string;
  user_id: string;
  title?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthChatMessage {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  created_at: string;
}

export function useAuthenticatedChatStorage(token: string) {
  const [conversations, setConversations] = useState<AuthChatConversation[]>([]);
  const [messages, setMessages] = useState<AuthChatMessage[]>([]);

  // Buscar conversas do usuário autenticado
  const fetchConversations = useCallback(async () => {
    try {
      const url = apiEndpoint('/chat/conversations');
      console.log('useAuthenticatedChatStorage.fetchConversations calling URL:', url);
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const body = await res.text();
        console.warn('useAuthenticatedChatStorage.fetchConversations: non-ok response', { status: res.status, body: body.substring(0, 500) });
        return [];
      }
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        console.log('useAuthenticatedChatStorage.fetchConversations: parsed response', data);
        // Não atualizar o estado local para evitar re-renders desnecessários
        // setConversations(data.data || []);
        return data.data || [];
      } catch (e) {
        // Non-JSON response (HTML/401) - return empty
        console.warn('useAuthenticatedChatStorage.fetchConversations: non-json response', { snippet: text.substring(0, 500) });
        return [];
      }
    } catch (err) {
      console.error('fetchConversations error', err);
      return [];
    }
  }, [token]);

  // Criar nova conversa
  const createConversation = useCallback(async (title?: string) => {
    try {
      const url = apiEndpoint('/chat/conversations');
      console.log('useAuthenticatedChatStorage.createConversation calling URL:', url);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title })
      });
      const status = res.status;
      const body = await res.text();
      if (!res.ok) {
        console.warn('useAuthenticatedChatStorage.createConversation: non-ok', { status, body: body.substring(0, 500) });
        return null;
      }
      try {
        const data = JSON.parse(body);
        console.log('useAuthenticatedChatStorage.createConversation: parsed', data);
        return data.data;
      } catch (e) {
        console.warn('useAuthenticatedChatStorage.createConversation: non-json response', { snippet: body.substring(0, 500) });
        return null;
      }
    } catch (err) {
      console.error('createConversation error', err);
      return null;
    }
  }, [token]);

  // Buscar mensagens de uma conversa
  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      const url = apiEndpoint(`/chat/conversations/${conversationId}/messages`);
      console.log('useAuthenticatedChatStorage.fetchMessages calling URL:', url);
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const status = res.status;
      const body = await res.text();
      if (!res.ok) {
        console.warn('useAuthenticatedChatStorage.fetchMessages: non-ok', { status, body: body.substring(0, 500) });
        return [];
      }
      try {
        const data = JSON.parse(body);
        console.log('useAuthenticatedChatStorage.fetchMessages: parsed', { 
          conversationId, 
          length: (data.data || []).length,
          rawData: data,
          firstItem: data.data?.[0] ? {
            id: data.data[0].id,
            role: data.data[0].role,
            content: data.data[0].content?.substring(0, 50)
          } : null
        });
        // Não atualizar o estado local para evitar re-renders desnecessários
        // setMessages(data.data || []);
        return data.data || [];
      } catch (e) {
        console.warn('useAuthenticatedChatStorage.fetchMessages: non-json response', { snippet: body.substring(0, 500) });
        return [];
      }
    } catch (err) {
      console.error('fetchMessages error', err);
      return [];
    }
  }, [token]);

  // Adicionar mensagem
  const addMessage = useCallback(async (conversationId: string, sender: string, content: string) => {
    try {
      const url = apiEndpoint(`/chat/conversations/${conversationId}/messages`);
      console.log('useAuthenticatedChatStorage.addMessage calling URL:', url);
      console.log('useAuthenticatedChatStorage.addMessage sending:', { conversationId, sender, content: content.substring(0, 50) });
      
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sender, content })
      });
      const status = res.status;
      const body = await res.text();
      if (!res.ok) {
        console.warn('useAuthenticatedChatStorage.addMessage: non-ok', { status, body: body.substring(0, 800) });
        return null;
      }
      try {
        const data = JSON.parse(body);
        console.log('useAuthenticatedChatStorage.addMessage: parsed', {
          data,
          dataData: data.data,
          dataDataRole: data.data?.role,
          dataDataContent: data.data?.content?.substring(0, 50)
        });
        return data.data;
      } catch (e) {
        console.warn('useAuthenticatedChatStorage.addMessage: non-json response', { snippet: body.substring(0, 800) });
        return null;
      }
    } catch (err) {
      console.error('addMessage error', err);
      return null;
    }
  }, [token]);

  // Deletar conversa
  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      const url = apiEndpoint(`/chat/conversations/${conversationId}`);
      console.log('useAuthenticatedChatStorage.deleteConversation calling URL:', url, { conversationId });
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const body = await res.text();
        if (res.status === 404) {
          console.warn('useAuthenticatedChatStorage.deleteConversation: Conversation not found', { status: res.status, body, conversationId });
        } else {
          console.warn('useAuthenticatedChatStorage.deleteConversation: non-ok response', { status: res.status, body, conversationId });
        }
        return false;
      }
      console.log('useAuthenticatedChatStorage.deleteConversation: success', { conversationId });
      return true;
    } catch (err) {
      console.error('deleteConversation error', { error: err, conversationId });
      return false;
    }
  }, [token]);

  // Buscar contagem de mensagens de uma conversa
  const fetchMessageCount = useCallback(async (conversationId: string): Promise<number> => {
    try {
      const url = apiEndpoint(`/chat/conversations/${conversationId}/messages`);
      console.log('useAuthenticatedChatStorage.fetchMessageCount calling URL:', url);
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const status = res.status;
      const body = await res.text();
      if (!res.ok) {
        console.warn('useAuthenticatedChatStorage.fetchMessageCount: non-ok', { status, body: body.substring(0, 500) });
        return 0;
      }
      try {
        const data = JSON.parse(body);
        console.log('useAuthenticatedChatStorage.fetchMessageCount: parsed', { 
          conversationId, 
          count: (data.data || []).length
        });
        return (data.data || []).length;
      } catch (e) {
        console.warn('useAuthenticatedChatStorage.fetchMessageCount: non-json response', { snippet: body.substring(0, 500) });
        return 0;
      }
    } catch (err) {
      console.error('fetchMessageCount error', err);
      return 0;
    }
  }, [token]);

  return { conversations, messages, fetchConversations, createConversation, fetchMessages, addMessage, deleteConversation, fetchMessageCount };
}

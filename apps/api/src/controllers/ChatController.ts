import { Request, Response } from 'express';
import { supabaseAdmin as supabase } from '../lib/supabase';

export class ChatController {
	// Buscar todas as conversas do usuário autenticado
	static async getUserConversations(req: Request, res: Response) {
		const userId = req.user?.id;
		
		if (!userId) {
			return res.status(401).json({ success: false, error: 'Usuário não autenticado' });
		}

		// Otimização: buscar apenas campos necessários e limitar resultados
		const { data, error } = await supabase
			.from('chat_conversations')
			.select('id, title, created_at, updated_at')
			.eq('user_id', userId)
			.order('updated_at', { ascending: false })
			.limit(50); // Limitar para melhorar performance

		if (error) {
			return res.status(500).json({ success: false, error: error.message });
		}

		// Adicionar cache headers para melhorar performance
		res.set({
			'Cache-Control': 'private, max-age=30', // Cache por 30 segundos
			'ETag': `"conversations-${userId}-${Date.now()}"`
		});

		return res.json({ success: true, data });
	}

	// Buscar mensagens de uma conversa
	static async getConversationMessages(req: Request, res: Response) {
		const userId = req.user?.id;
		const conversationId = req.params.id;
		if (!userId) return res.status(401).json({ success: false, error: 'Usuário não autenticado' });
		// Verifica se a conversa pertence ao usuário
		const { data: conv, error: convErr } = await supabase
			.from('chat_conversations')
			.select('id')
			.eq('id', conversationId)
			.eq('user_id', userId)
			.single();
		if (convErr || !conv) return res.status(404).json({ success: false, error: 'Conversa não encontrada' });
		const { data, error } = await supabase
			.from('chat_messages')
			.select('id, conversation_id, role, content, created_at')
			.eq('conversation_id', conversationId)
			.order('created_at', { ascending: true });
			
		if (error) {
			return res.status(500).json({ success: false, error: error.message });
		}
		
		return res.json({ success: true, data });
	}

	// Criar nova conversa
	static async createConversation(req: Request, res: Response) {
		const userId = req.user?.id;
		const { title } = req.body;
		
		if (!userId) {
			return res.status(401).json({ success: false, error: 'Usuário não autenticado' });
		}
		
		const conversationData = { 
			user_id: userId,
			title: title || `Conversa ${new Date().toLocaleDateString('pt-BR')}`
		};
		
		const { data, error } = await supabase
			.from('chat_conversations')
			.insert(conversationData)
			.select('*')
			.single();
			
		if (error) {
			return res.status(500).json({ success: false, error: error.message });
		}
		
		return res.status(201).json({ success: true, data });
	}

	// Salvar mensagem em uma conversa
	static async addMessage(req: Request, res: Response) {
		const userId = req.user?.id;
		const conversationId = req.params.id;
		const { sender, content } = req.body;
		
		if (!userId) {
			return res.status(401).json({ success: false, error: 'Usuário não autenticado' });
		}
		
		// Verifica se a conversa pertence ao usuário
		const { data: conv, error: convErr } = await supabase
			.from('chat_conversations')
			.select('id')
			.eq('id', conversationId)
			.eq('user_id', userId)
			.single();
			
		if (convErr || !conv) {
			return res.status(404).json({ success: false, error: 'Conversa não encontrada' });
		}
		
		// Tentar inserção com a coluna role (que parece existir na tabela)
		let insertData: any = { conversation_id: conversationId, content };
		let selectFields = 'id, conversation_id, content, created_at';
		
		// Usar 'role' ao invés de 'sender' baseado na estrutura atual da tabela
		if (sender) {
			insertData.role = sender; // Usar 'role' ao invés de 'sender'
			selectFields = 'id, conversation_id, role, content, created_at';
		}
		
		const { data, error } = await supabase
			.from('chat_messages')
			.insert(insertData)
			.select(selectFields)
			.single();
			
		if (error) {
			return res.status(500).json({ success: false, error: error.message });
		}
		
		return res.status(201).json({ success: true, data });
	}

	// Deletar uma conversa
	static async deleteConversation(req: Request, res: Response) {
		const userId = req.user?.id;
		const conversationId = req.params.id;

		if (!userId) {
			return res.status(401).json({ success: false, error: 'Usuário não autenticado' });
		}

		// Verifica se a conversa pertence ao usuário
		const { data: conv, error: convErr } = await supabase
			.from('chat_conversations')
			.select('id')
			.eq('id', conversationId)
			.eq('user_id', userId)
			.single();

		if (convErr || !conv) {
			return res.status(404).json({ success: false, error: 'Conversa não encontrada' });
		}

		// Deleta a conversa
		const { error: deleteErr } = await supabase
			.from('chat_conversations')
			.delete()
			.eq('id', conversationId);

		if (deleteErr) {
			return res.status(500).json({ success: false, error: deleteErr.message });
		}

		return res.json({ success: true, message: 'Conversa deletada com sucesso' });
	}
}

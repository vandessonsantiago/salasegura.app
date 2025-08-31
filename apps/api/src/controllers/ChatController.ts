import { Request, Response } from 'express';
import { supabaseAdmin as supabase } from '../lib/supabase';

export class ChatController {
	// Buscar todas as conversas do usuário autenticado
	static async getUserConversations(req: Request, res: Response) {
		const userId = req.user?.id;
		if (!userId) return res.status(401).json({ success: false, error: 'Usuário não autenticado' });
		const { data, error } = await supabase
			.from('chat_conversations')
			.select('*')
			.eq('user_id', userId)
			.order('created_at', { ascending: false });
		if (error) return res.status(500).json({ success: false, error: error.message });
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
		if (error) return res.status(500).json({ success: false, error: error.message });
		
		console.log('🔍 ChatController.getConversationMessages - Raw data from Supabase:', {
			conversationId,
			data,
			error,
			dataLength: data?.length,
			firstMessage: data?.[0] ? {
				id: data[0].id,
				role: data[0].role,
				content: data[0].content?.substring(0, 50),
				created_at: data[0].created_at
			} : null
		});
		
		return res.json({ success: true, data });
	}

	// Criar nova conversa
	static async createConversation(req: Request, res: Response) {
		const userId = req.user?.id;
		const { title } = req.body;
		console.log('🏗️ ChatController.createConversation:', { userId, title, hasUser: !!req.user });
		
		if (!userId) {
			console.log('❌ Usuário não autenticado');
			return res.status(401).json({ success: false, error: 'Usuário não autenticado' });
		}
		
		const conversationData = { 
			user_id: userId,
			title: title || `Conversa ${new Date().toLocaleDateString('pt-BR')}`
		};
		console.log('📝 Dados para inserir conversa:', conversationData);
		
		const { data, error } = await supabase
			.from('chat_conversations')
			.insert(conversationData)
			.select('*')
			.single();
			
		if (error) {
			console.log('❌ Erro ao criar conversa:', error);
			return res.status(500).json({ success: false, error: error.message });
		}
		
		console.log('✅ Conversa criada com sucesso:', data);
		return res.status(201).json({ success: true, data });
	}

	// Salvar mensagem em uma conversa
	static async addMessage(req: Request, res: Response) {
		const userId = req.user?.id;
		const conversationId = req.params.id;
		const { sender, content } = req.body;
		
		console.log('💾 ChatController.addMessage chamado:', { 
			userId, 
			conversationId, 
			sender, 
			content: content?.substring(0, 50),
			hasUser: !!req.user,
			body: req.body
		});
		
		if (!userId) {
			console.log('❌ Usuário não autenticado');
			return res.status(401).json({ success: false, error: 'Usuário não autenticado' });
		}
		// Verifica se a conversa pertence ao usuário
		const { data: conv, error: convErr } = await supabase
			.from('chat_conversations')
			.select('id')
			.eq('id', conversationId)
			.eq('user_id', userId)
			.single();
		if (convErr || !conv) return res.status(404).json({ success: false, error: 'Conversa não encontrada' });
		
		// Verificar se a tabela chat_messages existe e tem a estrutura correta
		try {
			// Tentar uma query simples para ver se a tabela existe
			const { error: testError } = await supabase
				.from('chat_messages')
				.select('count')
				.limit(1)
				.single();
			
			if (testError) {
				console.log('📝 Problema com tabela chat_messages:', testError.message);
				
				// Se a tabela não existe, tentar criar através de uma inserção que force a criação
				// Por enquanto, vamos tentar trabalhar sem a coluna sender
				console.log('� Tentando abordagem alternativa sem coluna sender...');
			}
		} catch (setupError) {
			console.error('❌ Erro durante verificação da tabela:', setupError);
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
		if (error) return res.status(500).json({ success: false, error: error.message });
		
		console.log('🔍 ChatController.addMessage - Data saved:', {
			conversationId,
			sender,
			content: content.substring(0, 50),
			data
		});
		
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

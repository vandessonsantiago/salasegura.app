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
			.select('*')
			.eq('conversation_id', conversationId)
			.order('created_at', { ascending: true });
		if (error) return res.status(500).json({ success: false, error: error.message });
		return res.json({ success: true, data });
	}

	// Criar nova conversa
	static async createConversation(req: Request, res: Response) {
		const userId = req.user?.id;
		if (!userId) return res.status(401).json({ success: false, error: 'Usuário não autenticado' });
		const { data, error } = await supabase
			.from('chat_conversations')
			.insert({ user_id: userId })
			.select('*')
			.single();
		if (error) return res.status(500).json({ success: false, error: error.message });
		return res.status(201).json({ success: true, data });
	}

	// Salvar mensagem em uma conversa
	static async addMessage(req: Request, res: Response) {
		const userId = req.user?.id;
		const conversationId = req.params.id;
		const { sender, content } = req.body;
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
			.insert({ conversation_id: conversationId, sender, content })
			.select('*')
			.single();
		if (error) return res.status(500).json({ success: false, error: error.message });
		return res.status(201).json({ success: true, data });
	}
}

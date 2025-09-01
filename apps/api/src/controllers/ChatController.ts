import { Request, Response } from 'express';
import { supabaseAdmin as supabase } from '../lib/supabase';
import { ChatAIService } from '../ai/services/ChatAIService';
import { UserContextService } from '../ai/services/UserContextService';
import { LegalService } from '../legal/services/LegalService';

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
		const { sender = 'user', content } = req.body; // sender opcional com valor padrão
		
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

	// Processar mensagem com IA contextual
	static async processMessage(req: Request, res: Response) {
		try {
			const { message, chatHistory = [] } = req.body;
			const userId = req.user?.id;

			// Validação básica de entrada
			if (!message || typeof message !== 'string' || message.trim().length === 0) {
				return res.status(400).json({
					success: false,
					error: 'Mensagem é obrigatória e deve ser uma string não vazia'
				});
			}

			console.log('📝 [CHAT] Processando mensagem:', {
				userId,
				messageLength: message.length,
				chatHistoryLength: chatHistory.length
			});

			// Buscar contexto do usuário se autenticado
			let userContext = null;
			if (userId) {
				userContext = await UserContextService.getUserContext(userId);
			}

			// Verificar se é uma pergunta jurídica específica
			const legalInfo = LegalService.searchLegalInfo(message);

			// Gerar resposta usando IA contextual
			const aiResponse = await ChatAIService.generateResponse(message, userContext, ChatAIService.getDefaultSystemPrompt());

			// Adicionar informações legais se relevante
			let enhancedResponse = aiResponse;
			if (legalInfo.length > 0 && legalInfo[0].relevance > 0.7) {
				const legalContext = `\n\n💡 **Informação Jurídica Relevante:**\n${legalInfo[0].data.title}\n${legalInfo[0].data.description || ''}`;
				enhancedResponse += legalContext;
			}

			// Salvar mensagem no histórico se usuário autenticado
			if (userId) {
				await this.saveMessage(userId, 'user', message);
				await this.saveMessage(userId, 'assistant', enhancedResponse);
			}

			res.json({
				success: true,
				response: enhancedResponse,
				legalContext: legalInfo.length > 0 ? legalInfo[0] : null,
				userContext: userContext ? {
					hasAppointments: userContext.activeAppointments.length > 0,
					hasCases: userContext.divorceCases.length > 0,
					conversationsCount: userContext.chatHistory.length
				} : null
			});

		} catch (error) {
			console.error('❌ [CHAT] Erro ao processar mensagem:', error);

			// Tentar resposta de fallback mesmo em caso de erro
			let fallbackResponse = 'Olá! Sou o advogado Vandesson Santiago. Como posso ajudar com sua questão jurídica?';

			try {
				// Se for erro de IA, tentar resposta sem contexto
				if (error instanceof Error && (error.message?.includes('OpenAI') || error.message?.includes('API'))) {
					fallbackResponse = 'Desculpe, estou com dificuldades técnicas no momento. Você pode reformular sua pergunta ou tentar novamente em alguns instantes?';
				}
			} catch (fallbackError) {
				console.warn('⚠️ [CHAT] Erro ao gerar resposta de fallback:', fallbackError);
			}

			res.status(500).json({
				success: false,
				error: 'Erro interno do servidor',
				fallback: fallbackResponse
			});
		}
	}

	// Método auxiliar para salvar mensagens
	private static async saveMessage(userId: string, role: string, content: string) {
		try {
			// Validar parâmetros
			if (!userId || !role || !content) {
				console.warn('⚠️ [CHAT] Parâmetros inválidos para salvar mensagem:', { userId, role, contentLength: content?.length });
				return;
			}

			// Buscar conversa ativa do usuário ou criar uma nova
			let { data: conversations } = await supabase
				.from('chat_conversations')
				.select('id')
				.eq('user_id', userId)
				.order('updated_at', { ascending: false })
				.limit(1);

			let conversationId: string;

			if (!conversations || conversations.length === 0) {
				// Criar nova conversa se não existir
				const { data: newConv, error: createErr } = await supabase
					.from('chat_conversations')
					.insert({
						user_id: userId,
						title: `Conversa ${new Date().toLocaleDateString('pt-BR')}`
					})
					.select('id')
					.single();

				if (createErr || !newConv) {
					console.warn('⚠️ [CHAT] Erro ao criar conversa:', createErr);
					return;
				}

				conversationId = newConv.id;
			} else {
				conversationId = conversations[0].id;
			}

			// Salvar mensagem
			const { error: insertErr } = await supabase
				.from('chat_messages')
				.insert({
					conversation_id: conversationId,
					role,
					content
				});

			if (insertErr) {
				console.warn('⚠️ [CHAT] Erro ao salvar mensagem:', insertErr);
			} else {
				console.log('✅ [CHAT] Mensagem salva com sucesso');
			}
		} catch (error) {
			console.warn('⚠️ [CHAT] Erro ao salvar mensagem:', error);
		}
	}

	// Deletar uma conversa
	static async deleteConversation(req: Request, res: Response) {
		const userId = req.user?.id;
		const conversationId = req.params.id;

		console.log('🗑️ [DELETE] Iniciando deleção de conversa:', { conversationId, userId });

		if (!userId) {
			console.log('❌ [DELETE] Usuário não autenticado');
			return res.status(401).json({ success: false, error: 'Usuário não autenticado' });
		}

		// Verifica se a conversa pertence ao usuário
		const { data: conv, error: convErr } = await supabase
			.from('chat_conversations')
			.select('id')
			.eq('id', conversationId)
			.eq('user_id', userId)
			.single();

		if (convErr) {
			console.log('❌ [DELETE] Erro ao buscar conversa:', convErr);
			return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
		}

		if (!conv) {
			console.log('❌ [DELETE] Conversa não encontrada ou não pertence ao usuário');
			return res.status(404).json({ success: false, error: 'Conversa não encontrada' });
		}

		console.log('✅ [DELETE] Conversa encontrada, iniciando deleção');

		// Primeiro, deleta todas as mensagens da conversa
		console.log('🗑️ [DELETE] Deletando mensagens da conversa...');
		const { error: deleteMessagesErr } = await supabase
			.from('chat_messages')
			.delete()
			.eq('conversation_id', conversationId);

		if (deleteMessagesErr) {
			console.log('❌ [DELETE] Erro ao deletar mensagens:', deleteMessagesErr);
			// Tentar uma abordagem alternativa se a primeira falhar
			console.log('🔄 [DELETE] Tentando abordagem alternativa para deletar mensagens...');
			const { data: messages, error: fetchMessagesErr } = await supabase
				.from('chat_messages')
				.select('id')
				.eq('conversation_id', conversationId);

			if (!fetchMessagesErr && messages) {
				for (const message of messages) {
					await supabase
						.from('chat_messages')
						.delete()
						.eq('id', message.id);
				}
				console.log('✅ [DELETE] Mensagens deletadas com abordagem alternativa');
			} else {
				return res.status(500).json({ success: false, error: 'Erro ao deletar mensagens da conversa' });
			}
		} else {
			console.log('✅ [DELETE] Mensagens deletadas com sucesso');
		}

		// Agora deleta a conversa
		console.log('🗑️ [DELETE] Deletando conversa...');
		const { error: deleteErr } = await supabase
			.from('chat_conversations')
			.delete()
			.eq('id', conversationId);

		if (deleteErr) {
			console.log('❌ [DELETE] Erro ao deletar conversa:', deleteErr);
			return res.status(500).json({ success: false, error: deleteErr.message });
		}

		console.log('✅ [DELETE] Conversa deletada com sucesso');
		return res.json({ success: true, message: 'Conversa deletada com sucesso' });
	}

	// Deletar todas as conversas do usuário
	static async deleteAllUserConversations(req: Request, res: Response) {
		const userId = req.user?.id;

		console.log('🗑️ [DELETE ALL] Iniciando deleção de todas as conversas:', { userId });

		if (!userId) {
			console.log('❌ [DELETE ALL] Usuário não autenticado');
			return res.status(401).json({ success: false, error: 'Usuário não autenticado' });
		}

		try {
			// Primeiro, buscar todas as conversas do usuário
			const { data: conversations, error: fetchErr } = await supabase
				.from('chat_conversations')
				.select('id')
				.eq('user_id', userId);

			if (fetchErr) {
				console.log('❌ [DELETE ALL] Erro ao buscar conversas:', fetchErr);
				return res.status(500).json({ success: false, error: 'Erro ao buscar conversas' });
			}

			if (!conversations || conversations.length === 0) {
				console.log('✅ [DELETE ALL] Nenhuma conversa encontrada para deletar');
				return res.json({ success: true, message: 'Nenhuma conversa para deletar' });
			}

			console.log(`🗑️ [DELETE ALL] Encontradas ${conversations.length} conversas para deletar`);

			// Deletar todas as mensagens das conversas do usuário
			console.log('🗑️ [DELETE ALL] Deletando mensagens...');
			const conversationIds = conversations.map(conv => conv.id);
			
			// Usar uma abordagem mais robusta para deletar mensagens
			for (const conversationId of conversationIds) {
				const { error: deleteMessagesErr } = await supabase
					.from('chat_messages')
					.delete()
					.eq('conversation_id', conversationId);

				if (deleteMessagesErr) {
					console.log(`❌ [DELETE ALL] Erro ao deletar mensagens da conversa ${conversationId}:`, deleteMessagesErr);
					// Continue tentando deletar outras conversas mesmo se uma falhar
				}
			}

			console.log('✅ [DELETE ALL] Mensagens deletadas com sucesso');

			// Agora deletar todas as conversas
			console.log('🗑️ [DELETE ALL] Deletando conversas...');
			const { error: deleteConversationsErr } = await supabase
				.from('chat_conversations')
				.delete()
				.eq('user_id', userId);

			if (deleteConversationsErr) {
				console.log('❌ [DELETE ALL] Erro ao deletar conversas:', deleteConversationsErr);
				return res.status(500).json({ success: false, error: deleteConversationsErr.message });
			}

			console.log(`✅ [DELETE ALL] ${conversations.length} conversas deletadas com sucesso`);
			return res.json({ 
				success: true, 
				message: `${conversations.length} conversas deletadas com sucesso` 
			});

		} catch (error) {
			console.log('❌ [DELETE ALL] Erro inesperado:', error);
			return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
		}
	}
}

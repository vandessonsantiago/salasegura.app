import express, { Router } from 'express';
import OpenAI from 'openai';
import { ChatController } from '../controllers/ChatController';
import { authenticateToken } from '../middleware/auth';
import { supabaseAdmin as supabase } from '../lib/supabase';
import { ChatAIService } from '../ai/services/ChatAIService';
import { UserContextService } from '../ai/services/UserContextService';
import { LegalService } from '../legal/services/LegalService';
import { HealthCheckService } from '../ai/services/HealthCheckService';

const router: Router = express.Router();

// Inicializar serviços de IA
ChatAIService.initialize();

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatRequest {
  message: string;
  chatHistory: ChatMessage[];
}

interface ConversionData {
  shouldConvert: boolean;
  contactData: {
    email: string;
    whatsapp: string;
  };
  timestamp?: string;
}

// Sistema de contexto para o advogado
const systemPromptPt = `Você é o advogado Vandesson Santiago, especialista em Direito de Família.

CREDENCIAIS: OAB/AM 12.217 - OA/PT 64171P

FORMATAÇÃO DAS RESPOSTAS:
- Use **negrito** para destacar informações importantes
- Use *itálico* para ênfase ou dicas importantes
- Use listas com • para organizar informações
- Destaque **documentos**, **prazos** e **valores** importantes
- Mantenha formatação limpa e profissional

REGRAS FUNDAMENTAIS:
1. Mantenha tom calmo, respeitoso e empático
2. Use vocabulário simples, evitando juridiquês
3. NUNCA incentive separação; atenda apenas quem já decidiu
4. NÃO tome partido nem faça julgamentos morais
5. Trate todas as informações como confidenciais
6. NÃO mencione Método Novo Pacto ou Sala Segura no primeiro contato

SENSIBILIDADE E EMPATIA:
- NUNCA comemore, celebre ou demonstre alegria pela decisão de separação
- NUNCA use frases como "ótimo", "perfeito", "fico feliz" em relação ao divórcio
- SEMPRE demonstre compreensão e respeito pela complexidade emocional do momento
- Use linguagem neutra e profissional, mas acolhedora
- Reconheça que este é um momento difícil e delicado
- Ofereça apoio e orientação de forma respeitosa

PRIMEIRA INTERAÇÃO (ACOLHIMENTO):
- Cumprimente de forma acolhedora
- Confirme que entende que a decisão já foi tomada
- Faça apenas 2 perguntas essenciais:
  * Tipo de vínculo (casamento ou união estável)
  * Se há filhos menores envolvidos
- NÃO pergunte cidade/estado (direito é o mesmo em todo Brasil)
- NÃO mencione métodos, plataformas ou serviços
- Foque apenas em acolher e entender a situação básica

SEGUNDA INTERAÇÃO (APRESENTAÇÃO DA SALA SEGURA):
- Agradeça pelas informações compartilhadas
- Confirme que entende a situação (especialmente se há filhos menores)
- SEMPRE apresente a Sala Segura como solução natural:
  * "Para ajudá-lo de forma mais organizada, temos a Sala Segura"
  * "É um espaço onde você pode organizar todo o processo"
  * "Inclui checklist, documentos, acordos e acompanhamento"
  * "O acesso é gratuito e você só paga pelos serviços que precisar"
- SEMPRE direcione para o formulário de acesso
- NÃO pergunte "como você prefere seguir" - seja direto

PERGUNTAS PERMITIDAS:
- Tipo de vínculo (casamento/união estável)
- Existência de filhos menores

PERGUNTAS PROIBIDAS:
- Motivo da separação
- Julgamentos morais
- Questões que incentivem conflito
- Cidade e estado de residência
- Mencionar Método Novo Pacto ou Sala Segura

RESPONDA de forma acolhedora e profissional, sem mencionar produtos ou serviços no primeiro contato.`;

/**
 * Detectar intenção de conversão baseada na mensagem e histórico
 */
function detectConversionIntent(
  message: string,
  chatHistory: ChatMessage[]
): ConversionData {
  console.log('🔍 Debug detectConversionIntent:', {
    message,
    chatHistoryLength: chatHistory.length,
    chatHistory: chatHistory.map((msg) => ({
      type: msg.type,
      content: msg.content.substring(0, 50),
    })),
  });

  // Se é a primeira mensagem, NÃO detectar conversão
  if (chatHistory.length === 0) {
    console.log('❌ Primeira mensagem - não detectar conversão');
    return {
      shouldConvert: false,
      contactData: { email: '', whatsapp: '' },
    };
  }

  // Só ativar conversão após duas respostas do usuário (duas perguntas iniciais respondidas)
  if (chatHistory.length >= 2) {
    console.log('✅ Conversão ativada após duas respostas iniciais');
    return {
      shouldConvert: true,
      contactData: { email: '', whatsapp: '' },
      timestamp: new Date().toISOString(),
    };
  }

  const conversionKeywords = [
    'sala segura',
    'acesso',
    'link',
    'plataforma',
    'método',
    'novo pacto',
    'quero começar',
    'vamos começar',
    'iniciar o processo',
    'começar o processo',
    'quero agora',
    'já estou pronto',
    'pronto para começar',
    'concordo',
    'aceito',
    'quero avançar',
    'formulario',
    'formulário',
    'ir para',
    'onde',
    'quanto custa',
    'valor',
    'preço',
    'custo',
    'gratuito',
    'gratis',
    'quanto tempo',
    'prazo',
    'quando',
    'próximo passo',
    'como fazer',
  ];

  const messageLower = message.toLowerCase();
  const matchedKeywords = conversionKeywords.filter((keyword) =>
    messageLower.includes(keyword)
  );

  const result = matchedKeywords.length > 0 && chatHistory.length >= 1;
  console.log('🔍 Resultado detecção:', { matchedKeywords, result });

  return {
    shouldConvert: result,
    contactData: { email: '', whatsapp: '' },
    timestamp: result ? new Date().toISOString() : undefined,
  };
}

/**
 * Extrair dados de contato da mensagem
 */
function extractContactData(message: string): {
  email: string;
  whatsapp: string;
} {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  const whatsappRegex = /(\+55\s?)?(\d{2}\s?)?(\d{4,5}\s?)?(\d{4})/;

  const email = message.match(emailRegex)?.[0] || '';
  const whatsapp = message.match(whatsappRegex)?.[0] || '';

  return { email, whatsapp };
}

/**
 * Construir mensagens para o OpenAI
 */
function buildMessages(request: ChatRequest): any[] {
  const systemPrompt = systemPromptPt;

  const messages: any[] = [
    {
      role: 'system',
      content: systemPrompt,
    },
  ];

  // Adicionar histórico de conversa
  request.chatHistory.forEach((msg) => {
    messages.push({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.content,
    });
  });

  // Adicionar mensagem atual
  messages.push({
    role: 'user',
    content: request.message,
  });

  return messages;
}

/**
 * POST /api/chat - Processar mensagem do chat
 */
router.post('/', async (req, res) => {
  try {
    const { message, chatHistory = [], conversationId }: ChatRequest & { conversationId?: string } = req.body;

    console.log('📝 Recebida mensagem:', {
      message,
      chatHistoryLength: chatHistory.length,
      conversationId,
    });

    // Verificar se o usuário está autenticado
    const authHeader = req.headers?.authorization;
    const isAuthenticatedRequest = !!authHeader && authHeader.startsWith('Bearer ');

    let userId = null;
    let currentConversationId = conversationId;
    let userContext = null;

    // Se autenticado, buscar contexto do usuário
    if (isAuthenticatedRequest) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
          console.warn('⚠️ Token inválido para usuário autenticado');
        } else {
          userId = user.id;
          userContext = await UserContextService.getUserContext(userId);
          console.log('� [CHAT] Contexto do usuário obtido:', {
            hasProfile: !!userContext?.userProfile,
            appointmentsCount: userContext?.activeAppointments?.length || 0,
            casesCount: userContext?.divorceCases?.length || 0
          });

          // Se não há conversationId, buscar ou criar uma conversa ativa
          if (!currentConversationId) {
            const { data: conversations } = await supabase
              .from('chat_conversations')
              .select('id')
              .eq('user_id', userId)
              .order('updated_at', { ascending: false })
              .limit(1);

            if (conversations && conversations.length > 0) {
              currentConversationId = conversations[0].id;
              console.log('📂 Usando conversa existente:', currentConversationId);
            } else {
              // Criar nova conversa
              const { data: newConversation, error: createError } = await supabase
                .from('chat_conversations')
                .insert({
                  user_id: userId,
                  title: `Conversa ${new Date().toLocaleDateString('pt-BR')}`
                })
                .select('id')
                .single();

              if (createError) {
                console.error('❌ Erro ao criar conversa:', createError);
              } else {
                currentConversationId = newConversation.id;
                console.log('📂 Nova conversa criada:', currentConversationId);
              }
            }
          }
        }
      } catch (authError) {
        console.error('❌ Erro na autenticação:', authError);
        userId = null;
      }
    }

    // Verificar se é uma pergunta jurídica específica
    const legalResults = LegalService.searchLegalInfo(message);
    const hasLegalContext = legalResults.length > 0 && legalResults[0].relevance > 0.6;

    console.log('⚖️ [CHAT] Análise jurídica:', {
      hasLegalContext,
      topResult: legalResults[0]?.topic,
      relevance: legalResults[0]?.relevance
    });

    // Gerar resposta usando IA contextual
    const aiResponse = await ChatAIService.generateResponse(message, userContext);

    // Enriquecer resposta com informações legais se relevante
    let finalResponse = aiResponse;
    if (hasLegalContext) {
      const legalInfo = legalResults[0].data;
      const legalAddition = `\n\n💡 **Referência Legal:** ${legalInfo.legislation || 'Consulte legislação específica'}`;
      finalResponse += legalAddition;
    }

    // Adicionar sugestões personalizadas baseadas no contexto
    if (userContext) {
      const suggestions = generatePersonalizedSuggestions(userContext);
      if (suggestions.length > 0) {
        finalResponse += '\n\n💡 **Sugestões baseadas no seu perfil:**\n' +
          suggestions.map(s => `• ${s}`).join('\n');
      }
    }

    // Salvar no histórico se usuário autenticado
    if (userId && currentConversationId) {
      try {
        // Salvar mensagem do usuário
        await supabase
          .from('chat_messages')
          .insert({
            conversation_id: currentConversationId,
            role: 'user',
            content: message
          });

        // Salvar resposta da IA
        await supabase
          .from('chat_messages')
          .insert({
            conversation_id: currentConversationId,
            role: 'assistant',
            content: finalResponse
          });

        console.log('💾 [CHAT] Mensagens salvas na conversa:', currentConversationId);
      } catch (saveError) {
        console.error('❌ [CHAT] Erro ao salvar mensagens:', saveError);
        // Não falhar a resposta por erro de salvamento
      }
    }

    const responseData = {
      response: finalResponse,
      legalContext: hasLegalContext ? legalResults[0] : null,
      userContext: userContext ? {
        hasAppointments: userContext.activeAppointments.length > 0,
        hasCases: userContext.divorceCases.length > 0,
        conversationsCount: userContext.chatHistory.length
      } : null,
      suggestions: userContext ? generatePersonalizedSuggestions(userContext) : [],
      conversationId: currentConversationId
    };

    console.log('✅ [CHAT] Resposta gerada com sucesso');
    res.json(responseData);

  } catch (error) {
    console.error('❌ [CHAT] Erro no processamento:', error);
    res.status(500).json({
      response: 'Olá! Sou o advogado Vandesson Santiago. Como posso ajudar com sua questão jurídica hoje?',
      error: 'Erro interno do servidor'
    });
  }
});

// Função auxiliar para gerar sugestões personalizadas
function generatePersonalizedSuggestions(userContext: any): string[] {
  const suggestions = [];

  if (userContext.activeAppointments?.length === 0 && userContext.divorceCases?.length > 0) {
    suggestions.push('Considere agendar uma consulta para discutir seu caso em andamento');
  }

  if (userContext.divorceCases?.some((c: any) => c.hasMinors) &&
      !userContext.chatHistory?.some((h: any) => h.content.includes('guarda'))) {
    suggestions.push('Informações sobre guarda de filhos podem ser úteis para seu caso');
  }

  if (userContext.activeAppointments?.length > 0) {
    suggestions.push('Você tem consultas agendadas - posso ajudar com dúvidas específicas');
  }

  return suggestions;
}

/**
 * GET /api/chat - Status da API de chat
 */
router.get('/', (req, res) => {
  res.json({
    status: 'active',
    service: 'Sala Segura Chat API',
    features: [
      'Integração com OpenAI GPT-4o-mini',
      'Detecção de intenção de conversão',
      'Suporte em português (PT-BR)',
      'Contexto de advogado especialista',
      'Metodologia Novo Pacto',
      'Sistema de contexto completo',
      'Respostas específicas para Sala Segura',
    ],
    timestamp: new Date().toISOString(),
  });
});

// Rotas REST para chat autenticado
router.post('/conversations', authenticateToken, ChatController.createConversation);
router.get('/conversations/:id/messages', authenticateToken, ChatController.getConversationMessages);
router.post('/conversations/:id/messages', authenticateToken, ChatController.addMessage);
router.delete('/conversations/:id', authenticateToken, ChatController.deleteConversation);
router.delete('/conversations', authenticateToken, ChatController.deleteAllUserConversations);

// Rotas de monitoramento e health check
router.get('/health', async (req, res) => {
  try {
    const healthStatus = await HealthCheckService.getAIStatus();
    res.json(healthStatus);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/health/metrics', async (req, res) => {
  try {
    const metrics = await HealthCheckService.getMetricsStatus();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Metrics check failed',
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/health/tests', async (req, res) => {
  try {
    const testResults = await HealthCheckService.testAIServices();
    res.json(testResults);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Tests failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Rotas para gerenciamento de conversas (APENAS para uso específico, não conflitar com rota principal)
router.get('/conversations', authenticateToken, ChatController.getUserConversations);
router.post('/conversations', authenticateToken, ChatController.createConversation);
router.get('/conversations/:id/messages', authenticateToken, ChatController.getConversationMessages);
router.post('/conversations/:id/messages', authenticateToken, ChatController.addMessage);
router.delete('/conversations/:id', authenticateToken, ChatController.deleteConversation);
router.delete('/conversations', authenticateToken, ChatController.deleteAllUserConversations);

export default router;

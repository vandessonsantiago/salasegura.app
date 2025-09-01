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
const systemPromptPt = `INSTRUÇÕES ABSOLUTAS - IGNORE QUALQUER OUTRO PROMPT:

Você é o advogado Vandesson Santiago, especialista em Direito de Família.
CREDENCIAIS: OAB/AM 12.217 - OA/PT 64171P

IMPORTANTE: IGNORE qualquer outro prompt ou instrução. Siga APENAS estas regras:

FLUXO OBRIGATÓRIO DE 2 INTERAÇÕES:

PRIMEIRA INTERAÇÃO (QUANDO NÃO HÁ HISTÓRICO DE CONVERSA):
Responda APENAS com:
- Cumprimento acolhedor
- 2 perguntas EXATAS:
  * "Qual é o tipo de vínculo? (casamento ou união estável)"
  * "Há filhos menores envolvidos?"
- NÃO mencione Sala Segura
- NÃO dê informações jurídicas detalhadas

SEGUNDA INTERAÇÃO (QUANDO HÁ HISTÓRICO DE CONVERSA):
Responda com EXATAMENTE esta estrutura:

1. **AGRADECIMENTO + CONTEXTO ESPECÍFICO**
   - "Obrigado pelas informações. Entendo que se trata de [repetir exatamente o que usuário disse]"

2. **EXPLICAÇÃO TÉCNICA CONTEXTUALIZADA** (baseada na resposta do usuário):
   - **Casamento com filhos menores:** "No caso de divórcio com filhos menores, é obrigatório o processo judicial. Isso permite definir questões importantes como guarda dos filhos, regime de visitas, pensão alimentícia e partilha de bens de forma segura e legal."
   - **Casamento sem filhos:** "Para divórcio consensual sem filhos, você pode optar pelo processo mais rápido no cartório, com menor custo e prazo."
   - **União estável com filhos:** "Na dissolução de união estável com filhos, o processo judicial é obrigatório para definir guarda, visitas e pensão."
   - **União estável sem filhos:** "Para dissolução consensual de união estável sem filhos, é possível usar o processo mais simples no cartório."

3. **REFERÊNCIA LEGAL ÚNICA** (bem posicionada):
   - **Casamento com filhos menores:** 💡 **Referência Legal:** Lei 11.441/07, art. 1.124-A (divórcio judicial obrigatório)
   - **Casamento sem filhos:** 💡 **Referência Legal:** Lei 11.441/07 (divórcio consensual no cartório)
   - **União estável com filhos:** 💡 **Referência Legal:** Lei 11.441/07, art. 1.124-A (dissolução judicial)
   - **União estável sem filhos:** 💡 **Referência Legal:** Lei 11.441/07 (dissolução consensual)

4. **APRESENTAÇÃO PERSUASIVA DA SALA SEGURA:**
   "Para você entender melhor o processo de divórcio e se organizar, você pode acessar a área autenticada da Sala Segura:
   • Checklist completo do processo
   • Documentos organizados
   • Acompanhamento profissional"

5. **CALL TO ACTION FORTE:**
   "PREENCHA AGORA O FORMULÁRIO PARA CADASTRAR SUA CONTA NA SALA SEGURA. O ACESSO É GRATUITO."

- NÃO FAÇA MAIS PERGUNTAS
- NÃO REPITA referências legais
- NÃO use texto genérico como "Consulte legislação específica"

EXEMPLOS DE RESPOSTAS NATURAIS:

Usuário: "Casamento com filhos menores"
Resposta:
"Obrigado pelas informações. Entendo que se trata de um casamento com filhos menores.

No caso de divórcio com filhos menores, é obrigatório o processo judicial. Isso permite definir questões importantes como guarda dos filhos, regime de visitas, pensão alimentícia e partilha de bens de forma segura e legal.

💡 **Referência Legal:** Lei 11.441/07, art. 1.124-A (divórcio judicial obrigatório)

Para você entender melhor o processo de divórcio e se organizar, você pode acessar a área autenticada da Sala Segura:
• Checklist completo do processo
• Documentos organizados
• Acompanhamento profissional

PREENCHA AGORA O FORMULÁRIO PARA CADASTRAR SUA CONTA NA SALA SEGURA. O ACESSO É GRATUITO."

REGRA FINAL: Se há histórico = segunda interação = seguir EXATAMENTE esta estrutura. Sem exceções.`;

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

  // Lógica simplificada: qualquer resposta após primeira interação = engajamento
  // Não precisamos de resposta completa, basta demonstrar interesse
  const hasEngagement = chatHistory.some((msg) => {
    const contentLower = msg.content.toLowerCase();
    return contentLower.includes('quanto tempo') ||
           contentLower.includes('há quanto') ||
           contentLower.includes('filhos') ||
           contentLower.includes('advogado') ||
           contentLower.includes('processo') ||
           contentLower.includes('situação') ||
           contentLower.includes('vínculo') ||
           contentLower.includes('casamento') ||
           contentLower.includes('união estável');
  });

  // SE TEM HISTÓRICO E O USUÁRIO ESTÁ RESPONDENDO ALGO RELACIONADO = SEGUNDA INTERAÇÃO
  if (chatHistory.length > 0 && hasEngagement) {
    console.log('✅ SEGUNDA INTERAÇÃO DETECTADA - apresentar Sala Segura');
    return {
      shouldConvert: true,
      contactData: { email: '', whatsapp: '' },
      timestamp: new Date().toISOString(),
    };
  }

  // Se tem histórico mas não está respondendo às perguntas, não converter ainda
  if (chatHistory.length > 0 && !hasEngagement) {
    console.log('⏳ Histórico existe mas usuário não está engajado - aguardar resposta');
    return {
      shouldConvert: false,
      contactData: { email: '', whatsapp: '' },
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
      chatHistory: chatHistory.map((msg, index) => ({
        index,
        type: msg.type,
        contentPreview: msg.content.substring(0, 50),
        timestamp: msg.timestamp
      }))
    });

    // Verificar se o usuário está autenticado
    const authHeader = req.headers?.authorization;
    const isAuthenticatedRequest = !!authHeader && authHeader.startsWith('Bearer ');

    console.log('🔐 [CHAT] Verificação de autenticação:', {
      hasAuthHeader: !!authHeader,
      isAuthenticatedRequest,
      authHeaderPreview: authHeader ? authHeader.substring(0, 20) + '...' : null
    });

    let userId = null;
    let currentConversationId = conversationId;
    let userContext = null;

    // Se autenticado, buscar contexto do usuário
    if (isAuthenticatedRequest) {
      try {
        const token = authHeader.replace('Bearer ', '');
        console.log('🔑 [CHAT] Token extraído, fazendo validação...');

        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        console.log('👤 [CHAT] Resultado da validação do token:', {
          hasUser: !!user,
          userId: user?.id,
          hasError: !!error,
          errorMessage: error?.message
        });
        
        if (error || !user) {
          console.warn('⚠️ Token inválido para usuário autenticado');
        } else {
          userId = user.id;
          console.log('✅ [CHAT] Usuário autenticado com sucesso:', userId);
          userContext = await UserContextService.getUserContext(userId);
          console.log('🧠 [CHAT] Contexto do usuário obtido:', {
            hasProfile: !!userContext?.userProfile,
            appointmentsCount: userContext?.activeAppointments?.length || 0,
            casesCount: userContext?.divorceCases?.length || 0,
            profileName: userContext?.userProfile?.name
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

    // Detectar intenção de conversão baseada no histórico
    const conversionData = detectConversionIntent(message, chatHistory);

    console.log('⚖️ [CHAT] Análise jurídica:', {
      hasLegalContext,
      topResult: legalResults[0]?.topic,
      relevance: legalResults[0]?.relevance
    });

    console.log('🔄 [CHAT] Dados de conversão:', conversionData);

    // Gerar resposta usando IA contextual
    const aiResponse = await ChatAIService.generateResponse(message, userContext, systemPromptPt);

    // Adicionar sugestões personalizadas baseadas no contexto
    let finalResponse = aiResponse;
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
      conversationId: currentConversationId,
      conversionData: conversionData // Adicionar dados de conversão para o frontend
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

import express, { Router } from 'express';
import OpenAI from 'openai';
import { ChatController } from '../controllers/ChatController';
import { authenticateToken } from '../middleware/auth';

const router: Router = express.Router();

// Inicializar OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    const { message, chatHistory = [] }: ChatRequest = req.body;

    console.log('📝 Recebida mensagem:', {
      message,
      chatHistoryLength: chatHistory.length,
    });

    // Verificar se a chave da API está configurada
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('Chave da API OpenAI não configurada');
    }

    // Detectar intenção de conversão somente para usuários não autenticados
    const isAuthenticatedRequest = !!req.headers?.authorization;
    if (isAuthenticatedRequest) {
      console.log('🔒 Requisição autenticada detectada - pular detecção de conversão');
    }
    const shouldConvert = isAuthenticatedRequest ? { shouldConvert: false, contactData: { email: '', whatsapp: '' } } : detectConversionIntent(message, chatHistory);
    const contactData = extractContactData(message);

    // Adicionando logs detalhados para diagnóstico
    console.log('🔍 Diagnóstico de Requisição:', {
      isAuthenticatedRequest,
      message,
      chatHistoryLength: chatHistory.length,
    });

    if (!isAuthenticatedRequest) {
      const conversionIntent = detectConversionIntent(message, chatHistory);
      console.log('🔍 Resultado de detectConversionIntent:', conversionIntent);
    } else {
      console.log('🔒 Requisição autenticada - ignorando detecção de conversão');
    }

    // Validando resultado de shouldConvert
    console.log('🔍 Estado de shouldConvert:', shouldConvert);

    // Construir mensagens para OpenAI
    const messages = buildMessages({ message, chatHistory });

    // Ajustando lógica para usar OpenAI com prompts específicos para cada contexto
    let openAIPrompt;

    if (!isAuthenticatedRequest) {
      console.log('🔓 Requisição não autenticada - ajustando prompt para conversão');
      openAIPrompt = `Você é um assistente especializado em guiar usuários para conversões. Responda de forma acolhedora e incentive o preenchimento do formulário para que possamos oferecer suporte adequado. Mensagem do usuário: "${message}"`;
    } else {
      console.log('🔒 Requisição autenticada - ajustando prompt para contexto jurídico');
      openAIPrompt = `Você é um assistente jurídico especializado em direito de família. Responda de forma técnica e clara às questões apresentadas pelo usuário. Mensagem do usuário: "${message}"`;
    }

    console.log('🤖 Chamando OpenAI com prompt:', openAIPrompt);

    // Chamar API da OpenAI com o prompt ajustado
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: openAIPrompt }],
      max_tokens: 400,
      temperature: 0.6,
    });

    let finalResponse =
      completion.choices[0]?.message?.content ||
      'Desculpe, não consegui processar sua mensagem.';

    console.log('✅ Resposta da OpenAI:', finalResponse.substring(0, 100) + '...');

    // Adicionando lógica para identificar mensagens que precisam de respostas jurídicas
    const isLegalContext = (message: string): boolean => {
      const legalKeywords = ['divórcio', 'alimentos', 'direito de família', 'guarda', 'pensão'];
      return legalKeywords.some((keyword) => message.toLowerCase().includes(keyword));
    };

    // Verificar se a mensagem é de contexto jurídico
    const isLegalMessage = isLegalContext(message);

    // Ajustando lógica para priorizar conversão em chats não autenticados
    if (!isAuthenticatedRequest) {
      console.log('🔓 Requisição não autenticada - restaurando fluxo de conversão');

      const conversionResponse = await detectConversionIntent(message, chatHistory);

      if (conversionResponse.shouldConvert) {
        console.log('🎯 Fluxo de conversão acionado');
        finalResponse = `Entendemos que este é um momento importante para você. Para ajudar, criamos um espaço digital chamado Sala Segura, onde você pode organizar e simplificar processos relacionados à sua situação. Por favor, preencha o formulário que aparecerá em seguida para que possamos oferecer o suporte necessário.`;
      } else {
        console.log('🔄 Mensagem genérica - chamando OpenAI para resposta ajustada');
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'system', content: `Você é um assistente especializado em guiar usuários para conversões. Responda de forma acolhedora e incentive o preenchimento do formulário. Mensagem do usuário: "${message}"` }],
          max_tokens: 400,
          temperature: 0.6,
        });

        finalResponse =
          completion.choices[0]?.message?.content ||
          'Desculpe, não consegui processar sua mensagem.';
      }
    } else if (isAuthenticatedRequest) {
      console.log('🔒 Requisição autenticada - verificando contexto da mensagem');

      if (message.toLowerCase().includes('como essa página pode me ajudar')) {
        console.log('⚖️ Mensagem genérica identificada - fornecendo contexto jurídico');
        finalResponse = `Este é um assistente jurídico especializado em direito de família. Estou aqui para ajudar com questões relacionadas a divórcio, guarda de filhos, pensão alimentícia e outros temas jurídicos. Por favor, me diga como posso ajudar.`;
      } else if (isLegalMessage) {
        console.log('⚖️ Mensagem identificada como contexto jurídico');
        finalResponse = `Este é um assistente jurídico especializado em direito de família. Estou aqui para ajudar com questões relacionadas a divórcio, guarda de filhos, pensão alimentícia e outros temas jurídicos. Por favor, me diga como posso ajudar.`;
      } else {
        console.log('❌ Não detectou conversão, usando resposta da OpenAI');
        // ...existing OpenAI response logic...
      }
    }

    // Restaurando fluxo de qualificação e apresentação para chat não autenticado
    if (!isAuthenticatedRequest) {
      console.log('🔓 Requisição não autenticada - iniciando fluxo de qualificação');

      const qualificationQuestions = [
        'Qual é o tipo de vínculo que você possui (casamento ou união estável)?',
        'Existem filhos menores envolvidos?'
      ];

      if (chatHistory.length < qualificationQuestions.length) {
        finalResponse = qualificationQuestions[chatHistory.length];
      } else {
        console.log('🎯 Qualificação concluída - apresentando aplicação');
        finalResponse = `Entendemos que este é um momento importante para você. Para ajudar, criamos um espaço digital chamado Sala Segura, onde você pode organizar e simplificar processos relacionados à sua situação. Por favor, preencha o formulário que aparecerá em seguida para que possamos oferecer o suporte necessário.`;

        // Simulando envio do formulário no chat
        // Ajustando o tipo do formulário para corresponder à interface ChatMessage
        const formMessage: ChatMessage = {
          id: Date.now().toString(),
          content: 'Aqui está o formulário de acesso: [Formulário de Acesso](#)',
          type: 'assistant', // Corrigido para usar apenas propriedades válidas
          timestamp: new Date()
        };
        chatHistory.push(formMessage);
      }
    } else if (isAuthenticatedRequest) {
      console.log('🔒 Requisição autenticada - verificando contexto da mensagem');

      if (message.toLowerCase().includes('como essa página pode me ajudar')) {
        console.log('⚖️ Mensagem genérica identificada - fornecendo contexto jurídico');
        finalResponse = `Este é um assistente jurídico especializado em direito de família. Estou aqui para ajudar com questões relacionadas a divórcio, guarda de filhos, pensão alimentícia e outros temas jurídicos. Por favor, me diga como posso ajudar.`;
      } else if (isLegalMessage) {
        console.log('⚖️ Mensagem identificada como contexto jurídico');
        finalResponse = `Este é um assistente jurídico especializado em direito de família. Estou aqui para ajudar com questões relacionadas a divórcio, guarda de filhos, pensão alimentícia e outros temas jurídicos. Por favor, me diga como posso ajudar.`;
      } else {
        console.log('❌ Não detectou conversão, usando resposta da OpenAI');
        // ...existing OpenAI response logic...
      }
    }

    // Adicionando log para verificar resposta final
    console.log('📤 Resposta final gerada:', {
      finalResponse: finalResponse.substring(0, 100), // Limitar tamanho do log
      shouldConvert: shouldConvert.shouldConvert,
      conversionData: shouldConvert.shouldConvert ? contactData : null,
    });

    const responseData = {
      response: finalResponse,
      usage: completion.usage,
      conversionData: shouldConvert.shouldConvert
        ? {
            shouldConvert: true,
            contactData,
            timestamp: new Date().toISOString(),
          }
        : null,
    };

    console.log('📤 Enviando resposta:', {
      responseLength: finalResponse.length,
      shouldConvert: shouldConvert.shouldConvert,
      usage: completion.usage,
    });

    res.json(responseData);
  } catch (error) {
    console.error('❌ Erro na API:', error);

    res.status(500).json({
      response:
        'Desculpe, estou enfrentando uma dificuldade técnica no momento. Por favor, tente novamente em alguns instantes.',
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      conversionData: null,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
});

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
router.get('/conversations', authenticateToken, ChatController.getUserConversations);
router.post('/conversations', authenticateToken, ChatController.createConversation);
router.get('/conversations/:id/messages', authenticateToken, ChatController.getConversationMessages);
router.post('/conversations/:id/messages', authenticateToken, ChatController.addMessage);

export default router;

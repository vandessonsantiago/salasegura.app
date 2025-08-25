import { Request, Response, Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import OpenAI from 'openai';

const router: Router = Router();

// Inicializar OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// POST /dashboard-chat - Chat sobre divórcio e direito de família
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { message, chatHistory = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Mensagem é obrigatória e deve ser uma string',
      });
    }

    // System prompt para o contexto de direito de família
    const systemPrompt = `Você é um assistente jurídico especializado em Direito de Família no Brasil, focado em orientações gerais e educativas.

CONTEXTO:
- Você está na área autenticada da plataforma Sala Segura
- Forneça orientações jurídicas gerais e informações sobre processos
- Seja objetivo, profissional e acessível
- Use linguagem clara, mas tecnicamente correta
- Mantenha o foco no contexto brasileiro

ÁREAS DE ESPECIALIZAÇÃO:
• Divórcio no Brasil (consensual e litigioso)
• Pensão alimentícia (alimentos)
• Guarda de filhos e direito de visitas
• Partilha de bens no casamento e união estável
• Direitos e deveres dos cônjuges/companheiros
• Procedimentos judiciais e documentação necessária
• Prazos processuais e jurisprudência relevante
• União estável e seus efeitos jurídicos
• Adoção e filiação
• Violência doméstica e medidas protetivas

DIRETRIZES:
- Forneça informações precisas e atualizadas conforme o ordenamento jurídico brasileiro
- Cite leis relevantes (Código Civil, Lei Maria da Penha, ECA, etc.) quando apropriado
- Explique procedimentos de forma clara e didática
- Oriente sobre documentos necessários e prazos
- Mantenha sempre o tom profissional e empático
- Use exemplos práticos quando úteis

IMPORTANTE: 
- Sempre deixe claro que são orientações gerais
- Para casos específicos, recomende consulta jurídica personalizada
- Não dê conselhos que possam ser interpretados como advocacia sem licença
- Mantenha-se dentro dos limites éticos da orientação jurídica geral`;

    // Preparar histórico de conversa
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...chatHistory.slice(-10), // Manter apenas as últimas 10 mensagens
      { role: 'user', content: message },
    ];

    // Verificar se a API key está configurada
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key não configurada');
    }

    // Chamada para OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      max_tokens: 1000,
      temperature: 0.7,
      stream: false,
    });

    const reply = completion.choices[0]?.message?.content?.trim() || 
      'Desculpe, não consegui processar sua pergunta. Tente novamente.';

    res.json({
      success: true,
      reply,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Erro no dashboard chat:', error);

    // Resposta de fallback em caso de erro
    const fallbackReply = `Desculpe, ocorreu um erro técnico ao processar sua pergunta sobre direito de família. 

Por favor, tente novamente em alguns instantes. Se o problema persistir, nossa equipe jurídica está à disposição.

**Dica**: Você pode perguntar sobre divórcio, pensão alimentícia, guarda de filhos, partilha de bens e outros temas do direito de família brasileiro.`;

    res.json({
      success: false,
      error: 'Erro interno do servidor',
      reply: fallbackReply,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;

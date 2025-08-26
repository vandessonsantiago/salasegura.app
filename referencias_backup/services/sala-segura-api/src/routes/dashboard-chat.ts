const express = require("express")
const authenticateToken = require("../middleware/auth")
// Make this file a module for TypeScript
export {}
/**
 * @typedef {import('express').Request & { user?: { id: string, email: string, role: string } }} AuthenticatedRequest
 */
import OpenAI from "openai"

const router = express.Router()

// Inicializar OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Rota para chat do dashboard (protegida por autenticação)
/**
 * @param {import('express').Request & { user?: { id: string, email: string, role: string } }} req
 * @param {import('express').Response} res
 */
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { message, chatHistory = [] } = req.body

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Mensagem é obrigatória e deve ser uma string",
      })
    }

    // System prompt para o contexto administrativo
    const systemPrompt = `Você é um assistente jurídico especializado em Direito de Família, focado em orientações gerais e contextualizadas para administradores da plataforma Sala Segura.

CONTEXTO:
- Você está no painel administrativo da Sala Segura
- O usuário é um administrador ou advogado
- Forneça orientações jurídicas gerais e informações sobre processos
- Seja objetivo, profissional e preciso
- Use linguagem técnica apropriada para o contexto administrativo

ÁREAS DE CONHECIMENTO:
• Divórcio no Brasil (consensual e litigioso)
• Alimentos (pensão alimentícia)
• Guarda de filhos e visitas
• Partilha de bens
• Direitos e deveres dos cônjuges
• Procedimentos judiciais
• Documentação necessária
• Prazos processuais
• Jurisprudência relevante

DIRETRIZES:
- Forneça informações precisas e atualizadas
- Cite fontes legais quando apropriado
- Oriente sobre procedimentos administrativos
- Explique conceitos jurídicos de forma clara
- Mantenha o foco no contexto brasileiro
- Seja conciso mas completo

IMPORTANTE: Sempre deixe claro que são orientações gerais e que para casos específicos é necessário consulta jurídica personalizada.`

    // Preparar histórico de conversa
    const messages = [
      { role: "system", content: systemPrompt },
      ...chatHistory.slice(-10), // Manter apenas as últimas 10 mensagens
      { role: "user", content: message },
    ]

    // Chamada para OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages as any,
      max_tokens: 1000,
      temperature: 0.7,
      stream: false,
    })

    const reply =
      completion.choices[0]?.message?.content ||
      "Desculpe, não consegui processar sua pergunta. Tente novamente."

    res.json({
      success: true,
      reply: reply.trim(),
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("Erro no chat do dashboard:", error)

    // Resposta de fallback em caso de erro
    const fallbackReply = `Desculpe, ocorreu um erro técnico ao processar sua pergunta. 

Por favor, tente novamente em alguns instantes. Se o problema persistir, entre em contato com o suporte técnico.

Erro: ${error.message || "Erro desconhecido"}`

    res.status(500).json({
      error: "Erro interno do servidor",
      reply: fallbackReply,
    })
  }
})

module.exports = router

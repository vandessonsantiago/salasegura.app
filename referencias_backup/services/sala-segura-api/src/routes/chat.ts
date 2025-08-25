const express = require("express")
import OpenAI from "openai"

const router = express.Router()

// Configurar OpenAI
console.log(
  "🔑 OpenAI API Key:",
  process.env.OPENAI_API_KEY ? "Configurada" : "NÃO CONFIGURADA"
)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface ChatMessage {
  id: string
  type: "user" | "assistant"
  content: string
  timestamp: Date
}

interface ChatRequest {
  message: string
  chatHistory: ChatMessage[]
}

interface ConversionData {
  shouldConvert: boolean
  contactData: {
    email: string
    whatsapp: string
  }
  timestamp?: string
}

// Sistema de contexto para o advogado
const systemPromptPt = `Você é o advogado Vandesson Santiago, especialista em Direito de Família.

CREDENCIAIS: OAB/AM 12.217 - OA/PT 64171P

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

RESPONDA de forma acolhedora e profissional, sem mencionar produtos ou serviços no primeiro contato.`

/**
 * Detectar intenção de conversão baseada na mensagem e histórico
 */
function detectConversionIntent(
  message: string,
  chatHistory: ChatMessage[]
): ConversionData {
  console.log("🔍 Debug detectConversionIntent:", {
    message,
    chatHistoryLength: chatHistory.length,
    chatHistory: chatHistory.map((msg) => ({
      type: msg.type,
      content: msg.content.substring(0, 50),
    })),
  })

  // Se é a primeira mensagem, NÃO detectar conversão
  if (chatHistory.length === 0) {
    console.log("❌ Primeira mensagem - não detectar conversão")
    return {
      shouldConvert: false,
      contactData: { email: "", whatsapp: "" },
    }
  }

  // Se é a segunda interação (após o usuário responder as perguntas iniciais),
  // ativar conversão automaticamente
  if (chatHistory.length >= 1) {
    console.log(
      "✅ Segunda interação ou mais - ativar conversão automaticamente"
    )
    return {
      shouldConvert: true,
      contactData: { email: "", whatsapp: "" },
      timestamp: new Date().toISOString(),
    }
  }

  const conversionKeywords = [
    "sala segura",
    "acesso",
    "link",
    "plataforma",
    "método",
    "novo pacto",
    "quero começar",
    "vamos começar",
    "iniciar o processo",
    "começar o processo",
    "quero agora",
    "já estou pronto",
    "pronto para começar",
    "concordo",
    "aceito",
    "quero avançar",
    "formulario",
    "formulário",
    "ir para",
    "onde",
    "quanto custa",
    "valor",
    "preço",
    "custo",
    "gratuito",
    "gratis",
    "quanto tempo",
    "prazo",
    "quando",
    "próximo passo",
    "como fazer",
    "safe room",
    "access",
    "platform",
    "method",
    "new covenant",
    "want to start",
    "let's start",
    "start the process",
    "begin the process",
    "want now",
    "ready to start",
    "ready now",
    "agree",
    "accept",
    "want to proceed",
    "form",
    "go to",
    "where",
    "how much",
    "cost",
    "price",
    "free",
    "how long",
    "deadline",
    "when",
    "next step",
    "how to",
  ]

  const messageLower = message.toLowerCase()
  const matchedKeywords = conversionKeywords.filter((keyword) =>
    messageLower.includes(keyword)
  )

  const result = matchedKeywords.length > 0 && chatHistory.length >= 1
  console.log("🔍 Resultado detecção:", { matchedKeywords, result })

  return {
    shouldConvert: result,
    contactData: { email: "", whatsapp: "" },
    timestamp: result ? new Date().toISOString() : undefined,
  }
}

/**
 * Extrair dados de contato da mensagem
 */
function extractContactData(message: string): {
  email: string
  whatsapp: string
} {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/
  const whatsappRegex = /(\+55\s?)?(\d{2}\s?)?(\d{4,5}\s?)?(\d{4})/

  const email = message.match(emailRegex)?.[0] || ""
  const whatsapp = message.match(whatsappRegex)?.[0] || ""

  return { email, whatsapp }
}

/**
 * Construir mensagens para o OpenAI
 */
function buildMessages(request: ChatRequest): any[] {
  const systemPrompt = systemPromptPt

  const messages: any[] = [
    {
      role: "system",
      content: systemPrompt,
    },
  ]

  // Adicionar histórico de conversa
  request.chatHistory.forEach((msg) => {
    messages.push({
      role: msg.type === "user" ? "user" : "assistant",
      content: msg.content,
    })
  })

  // Adicionar mensagem atual
  messages.push({
    role: "user",
    content: request.message,
  })

  return messages
}

/**
 * Gerar resposta contextualizada baseada nas informações do usuário
 */
function generateContextualResponse(
  message: string,
  chatHistory: ChatMessage[]
): string {
  console.log("🔍 Debug generateContextualResponse:", {
    message,
    chatHistoryLength: chatHistory.length,
    chatHistory: chatHistory.map((msg) => ({
      type: msg.type,
      content: msg.content,
    })),
  })

  // Analisar o histórico para entender o contexto
  const hasChildren = chatHistory.some(
    (msg) =>
      msg.content.toLowerCase().includes("filhos") ||
      msg.content.toLowerCase().includes("crianças") ||
      msg.content.toLowerCase().includes("menores")
  )

  const hasNoChildren = chatHistory.some(
    (msg) =>
      msg.content.toLowerCase().includes("sem filhos") ||
      msg.content.toLowerCase().includes("não tem filhos") ||
      msg.content.toLowerCase().includes("sem crianças")
  )

  const isMarriage = chatHistory.some(
    (msg) =>
      msg.content.toLowerCase().includes("casamento") ||
      msg.content.toLowerCase().includes("casados")
  )

  const isUnion = chatHistory.some(
    (msg) =>
      msg.content.toLowerCase().includes("união estável") ||
      msg.content.toLowerCase().includes("uniao estavel")
  )

  console.log("🔍 Análise de contexto:", {
    hasChildren,
    hasNoChildren,
    isMarriage,
    isUnion,
  })

  // Gerar resposta contextualizada
  let contextualPart = ""

  if (hasChildren || hasNoChildren) {
    if (hasNoChildren) {
      contextualPart =
        "Entendo que essa situação pode ser complexa mesmo sem filhos envolvidos."
    } else {
      contextualPart =
        "Sei que lidar com essa situação, especialmente quando há filhos menores envolvidos, pode ser desafiador e trazer muitas preocupações emocionais e práticas."
    }
  } else {
    contextualPart =
      "Entendo que essa situação pode ser complexa e trazer muitas preocupações emocionais."
  }

  console.log("🔍 ContextualPart escolhida:", contextualPart)

  return `Agradeço pelas informações que você compartilhou. ${contextualPart}

Para tornar esse momento mais organizado e seguro, nosso escritório desenvolveu a Sala Segura: um espaço digital pensado para acompanhar cada etapa do processo de divórcio e reorganização familiar. Nela, você encontrará:

Checklists práticos para não esquecer nenhum detalhe;

Armazenamento protegido de documentos;

Modelos e apoio na elaboração de acordos;

Acompanhamento claro de todas as fases, seja judicial ou extrajudicial.

O acesso é totalmente gratuito, e você só paga pelos serviços jurídicos que realmente precisar.

Para começar, basta preencher o formulário que aparecerá em seguida. Logo depois, você será direcionado para criar sua senha e entrar na Sala Segura. A partir daí, poderá explorar os recursos disponíveis com tranquilidade — e estarei ao seu lado para esclarecer dúvidas sempre que necessário.`
}

/**
 * POST /api/v1/chat - Processar mensagem do chat
 */
router.post("/", async (req, res) => {
  try {
    const { message, chatHistory = [] }: ChatRequest = req.body

    console.log("📝 Recebida mensagem:", {
      message,
      chatHistoryLength: chatHistory.length,
    })

    // Verificar se a chave da API está configurada
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("Chave da API OpenAI não configurada")
    }

    // Detectar intenção de conversão
    const shouldConvert = detectConversionIntent(message, chatHistory)
    const contactData = extractContactData(message)

    console.log("🔍 Detecção de conversão:", {
      shouldConvert,
      contactData,
      message: message,
      chatHistoryLength: chatHistory.length,
      chatHistory: chatHistory.map((msg: any) => ({
        type: msg.type,
        content: msg.content.substring(0, 50),
      })),
    })

    // Construir mensagens para OpenAI
    const messages = buildMessages({ message, chatHistory })

    console.log("🤖 Chamando OpenAI...")

    // Chamar API da OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      max_tokens: 400,
      temperature: 0.6,
    })

    let finalResponse =
      completion.choices[0]?.message?.content ||
      "Desculpe, não consegui processar sua mensagem."

    console.log(
      "✅ Resposta da OpenAI:",
      finalResponse.substring(0, 100) + "..."
    )

    // Se detectou conversão, usar resposta específica sobre a Sala Segura
    if (shouldConvert.shouldConvert) {
      console.log("🎯 Usando generateContextualResponse")

      // Verificar se menciona "sem filhos"
      const mentionsNoChildren =
        message.toLowerCase().includes("sem filhos") ||
        message.toLowerCase().includes("não tem filhos") ||
        chatHistory.some((msg) =>
          msg.content.toLowerCase().includes("sem filhos")
        )

      if (mentionsNoChildren) {
        finalResponse = `Agradeço pelas informações que você compartilhou. Entendo que essa situação pode ser complexa mesmo sem filhos envolvidos.

Para tornar esse momento mais organizado e seguro, nosso escritório desenvolveu a Sala Segura: um espaço digital pensado para acompanhar cada etapa do processo de divórcio e reorganização familiar. Nela, você encontrará:

Checklists práticos para não esquecer nenhum detalhe;

Armazenamento protegido de documentos;

Modelos e apoio na elaboração de acordos;

Acompanhamento claro de todas as fases, seja judicial ou extrajudicial.

O acesso é totalmente gratuito, e você só paga pelos serviços jurídicos que realmente precisar.

Para começar, basta preencher o formulário que aparecerá em seguida. Logo depois, você será direcionado para criar sua senha e entrar na Sala Segura. A partir daí, poderá explorar os recursos disponíveis com tranquilidade — e estarei ao seu lado para esclarecer dúvidas sempre que necessário.`
      } else {
        finalResponse = `Agradeço pelas informações que você compartilhou. Sei que lidar com essa situação, especialmente quando há filhos menores envolvidos, pode ser desafiador e trazer muitas preocupações emocionais e práticas.

Para tornar esse momento mais organizado e seguro, nosso escritório desenvolveu a Sala Segura: um espaço digital pensado para acompanhar cada etapa do processo de divórcio e reorganização familiar. Nela, você encontrará:

Checklists práticos para não esquecer nenhum detalhe;

Armazenamento protegido de documentos;

Modelos e apoio na elaboração de acordos;

Acompanhamento claro de todas as fases, seja judicial ou extrajudicial.

O acesso é totalmente gratuito, e você só paga pelos serviços jurídicos que realmente precisar.

Para começar, basta preencher o formulário que aparecerá em seguida. Logo depois, você será direcionado para criar sua senha e entrar na Sala Segura. A partir daí, poderá explorar os recursos disponíveis com tranquilidade — e estarei ao seu lado para esclarecer dúvidas sempre que necessário.`
      }

      console.log("✅ Resposta contextualizada gerada")
    } else {
      console.log("❌ Não detectou conversão, usando resposta da OpenAI")
    }

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
    }

    console.log("📤 Enviando resposta:", {
      responseLength: finalResponse.length,
      shouldConvert: shouldConvert.shouldConvert,
      usage: completion.usage,
    })

    res.json(responseData)
  } catch (error) {
    console.error("❌ Erro na API:", error)

    res.status(500).json({
      response:
        "Desculpe, estou enfrentando uma dificuldade técnica no momento. Por favor, tente novamente em alguns instantes.",
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      conversionData: null,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    })
  }
})

/**
 * GET /api/v1/chat - Status da API de chat
 */
router.get("/", (req, res) => {
  res.json({
    status: "active",
    service: "Sala Segura Chat API",
    features: [
      "Integração com OpenAI GPT-4o-mini",
      "Detecção de intenção de conversão",
      "Suporte em português (PT-BR)",
      "Contexto de advogado especialista",
      "Metodologia Novo Pacto",
      "Sistema de contexto completo",
      "Respostas específicas para Sala Segura",
    ],
    timestamp: new Date().toISOString(),
  })
})

module.exports = router

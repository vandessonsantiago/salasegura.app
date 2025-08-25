const express = require("express")
const authenticateToken = require("../middleware/auth")
// Make this file a module for TypeScript
export {}
/**
 * @typedef {import('express').Request & { user?: { id: string, email: string, role: string } }} AuthenticatedRequest
 */
import { supabase } from "../config/supabase"
import type {
  ChecklistSession,
  ChecklistItem,
  CreateChecklistSessionRequest,
  UpdateChecklistItemRequest,
} from "../types/checklist"

const router = express.Router()

// Funções auxiliares
function getCategoryFromItemId(itemId: string): string {
  const categoryMap: { [key: string]: string } = {
    "1.1": "elegibilidade",
    "1.2": "elegibilidade",
    "1.3": "elegibilidade",
    "1.4": "elegibilidade",
    "1.5": "elegibilidade",
    "2.1": "documentos",
    "2.2": "documentos",
    "2.3": "documentos",
    "3.1": "filhos",
    "3.2": "filhos",
    "4.1": "patrimonio",
    "4.2": "patrimonio",
    "4.3": "patrimonio",
    "4.4": "patrimonio",
    "4.5": "patrimonio",
    "4.6": "patrimonio",
    "4.7": "patrimonio",
    "5.1": "alimentos",
    "5.2": "alimentos",
    "6.1": "procuração",
    "6.2": "procuração",
  }
  return categoryMap[itemId] || "outros"
}

function getItemText(itemId: string): string {
  const itemTextMap: { [key: string]: string } = {
    "1.1": "Divórcio será consensual (acordo entre as partes).",
    "1.2":
      "Não há filhos menores ou incapazes. Observação: quando há filhos menores ou incapazes, em regra o caminho adequado é judicial. Analisaremos seu caso para verificar alternativas seguras.",
    "1.3":
      "Não há gestação em curso. Observação: alguns cartórios exigem declaração específica sobre inexistência de gravidez.",
    "1.4":
      "Ambos possuem documentos de identificação válidos (RG/CPF) e estado civil atualizado.",
    "1.5":
      "Pelo menos um(a) comparecerá ao cartório com advogado(a) presente ou representado por procuração pública com poderes específicos.",
    "2.1":
      "Certidão de casamento atualizada (emitida recentemente; idealmente nos últimos 90 dias).",
    "2.2":
      "Pacto antenupcial (se houver), com registro no Cartório de Registro de Imóveis.",
    "2.3": "Comprovante de endereço de cada parte.",
    "3.1":
      "Certidões de nascimento/identidade (apenas para conferência e eventual menção no texto da escritura).",
    "3.2":
      "Plano parental não é obrigatório quando todos são maiores e capazes, mas acordos sobre apoio financeiro e convivência entre pais e filhos adultos podem ser registrados, se fizer sentido.",
    "4.1":
      "Lista dos bens a partilhar (imóveis, veículos, saldos, investimentos, quotas, objetos relevantes).",
    "4.2":
      "Documentos dos bens: Imóveis: matrículas atualizadas (Registro de Imóveis), IPTU, número de contribuinte, se houver.",
    "4.3": "Veículos: CRLV/CRV, renavam, situação financeira (se alienado).",
    "4.4":
      "Contas e investimentos: extratos recentes (somente para base de cálculo/descrição).",
    "4.5":
      "Dívidas/financiamentos: relação dos contratos, saldos, titularidade e como ficarão após o divórcio (assunção, quitação, rateio).",
    "4.6":
      "Definição sobre eventual compensação financeira (se um ficar com bem de maior valor, há acerto de diferença? Como e quando?).",
    "4.7":
      "Avaliação tributária da partilha (em regra, a partilha igualitária não gera ITBI; partilha desigual pode demandar atenção tributária local).",
    "5.1":
      "Alimentos entre cônjuges: há necessidade? Se sim, valor, forma de pagamento, início, reajuste, prazo e critérios de revisão.",
    "5.2":
      "Retomada do nome de solteiro(a) ou manutenção do nome de casado(a): decisão definida por cada parte.",
    "6.1":
      "Ambas as partes assinarão presencialmente com advogado(a) ou por instrumento de procuração pública com poderes específicos para divórcio e partilha.",
    "6.2":
      "Conferimos exigências específicas do cartório escolhido (agendamento, testemunhas, custas, documentos digitais).",
  }
  return itemTextMap[itemId] || "Item não encontrado"
}

// Dados padrão do checklist
const DEFAULT_CHECKLIST_ITEMS = [
  // Bloco 1 — Elegibilidade do procedimento no cartório
  {
    item_id: "1.1",
    category: "elegibilidade",
    text: "Divórcio será consensual (acordo entre as partes).",
  },
  {
    item_id: "1.2",
    category: "elegibilidade",
    text: "Não há filhos menores ou incapazes. Observação: quando há filhos menores ou incapazes, em regra o caminho adequado é judicial. Analisaremos seu caso para verificar alternativas seguras.",
  },
  {
    item_id: "1.3",
    category: "elegibilidade",
    text: "Não há gestação em curso. Observação: alguns cartórios exigem declaração específica sobre inexistência de gravidez.",
  },
  {
    item_id: "1.4",
    category: "elegibilidade",
    text: "Ambos possuem documentos de identificação válidos (RG/CPF) e estado civil atualizado.",
  },
  {
    item_id: "1.5",
    category: "elegibilidade",
    text: "Pelo menos um(a) comparecerá ao cartório com advogado(a) presente ou representado por procuração pública com poderes específicos.",
  },

  // Bloco 2 — Documentos pessoais e do casamento
  {
    item_id: "2.1",
    category: "documentos",
    text: "Certidão de casamento atualizada (emitida recentemente; idealmente nos últimos 90 dias).",
  },
  {
    item_id: "2.2",
    category: "documentos",
    text: "Pacto antenupcial (se houver), com registro no Cartório de Registro de Imóveis.",
  },
  {
    item_id: "2.3",
    category: "documentos",
    text: "Comprovante de endereço de cada parte.",
  },

  // Bloco 3 — Filhos (se houver filhos maiores e capazes)
  {
    item_id: "3.1",
    category: "filhos",
    text: "Certidões de nascimento/identidade (apenas para conferência e eventual menção no texto da escritura).",
  },
  {
    item_id: "3.2",
    category: "filhos",
    text: "Plano parental não é obrigatório quando todos são maiores e capazes, mas acordos sobre apoio financeiro e convivência entre pais e filhos adultos podem ser registrados, se fizer sentido.",
  },

  // Bloco 4 — Patrimônio e dívidas (se houver partilha)
  {
    item_id: "4.1",
    category: "patrimonio",
    text: "Lista dos bens a partilhar (imóveis, veículos, saldos, investimentos, quotas, objetos relevantes).",
  },
  {
    item_id: "4.2",
    category: "patrimonio",
    text: "Documentos dos bens: Imóveis: matrículas atualizadas (Registro de Imóveis), IPTU, número de contribuinte, se houver.",
  },
  {
    item_id: "4.3",
    category: "patrimonio",
    text: "Veículos: CRLV/CRV, renavam, situação financeira (se alienado).",
  },
  {
    item_id: "4.4",
    category: "patrimonio",
    text: "Contas e investimentos: extratos recentes (somente para base de cálculo/descrição).",
  },
  {
    item_id: "4.5",
    category: "patrimonio",
    text: "Dívidas/financiamentos: relação dos contratos, saldos, titularidade e como ficarão após o divórcio (assunção, quitação, rateio).",
  },
  {
    item_id: "4.6",
    category: "patrimonio",
    text: "Definição sobre eventual compensação financeira (se um ficar com bem de maior valor, há acerto de diferença? Como e quando?).",
  },
  {
    item_id: "4.7",
    category: "patrimonio",
    text: "Avaliação tributária da partilha (em regra, a partilha igualitária não gera ITBI; partilha desigual pode demandar atenção tributária local).",
  },

  // Bloco 5 — Alimentos e retomada do nome
  {
    item_id: "5.1",
    category: "alimentos",
    text: "Alimentos entre cônjuges: há necessidade? Se sim, valor, forma de pagamento, início, reajuste, prazo e critérios de revisão.",
  },
  {
    item_id: "5.2",
    category: "alimentos",
    text: "Retomada do nome de solteiro(a) ou manutenção do nome de casado(a): decisão definida por cada parte.",
  },

  // Bloco 6 — Procuração e assinaturas
  {
    item_id: "6.1",
    category: "procuração",
    text: "Ambas as partes assinarão presencialmente com advogado(a) ou por instrumento de procuração pública com poderes específicos para divórcio e partilha.",
  },
  {
    item_id: "6.2",
    category: "procuração",
    text: "Conferimos exigências específicas do cartório escolhido (agendamento, testemunhas, custas, documentos digitais).",
  },
]

// GET /api/v1/checklist/sessions - Listar sessões do usuário
/**
 * @param {import('express').Request & { user?: { id: string, email: string, role: string } }} req
 * @param {import('express').Response} res
 */
router.get("/sessions", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" })
    }

    const { data: sessions, error } = await supabase
      .from("checklist_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Erro ao buscar sessões:", error)
      return res.status(500).json({ error: "Erro interno do servidor" })
    }

    res.json({ sessions: sessions || [] })
  } catch (error) {
    console.error("Erro ao listar sessões:", error)
    res.status(500).json({ error: "Erro interno do servidor" })
  }
})

// POST /api/v1/checklist/sessions - Criar nova sessão
/**
 * @param {import('express').Request & { user?: { id: string, email: string, role: string } }} req
 * @param {import('express').Response} res
 */
router.post("/sessions", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id
    const {
      title = 'Checklist "Você está pronto(a) para o cartório?"',
    }: CreateChecklistSessionRequest = req.body

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" })
    }

    // Criar sessão
    const { data: session, error: sessionError } = await supabase
      .from("checklist_sessions")
      .insert({
        user_id: userId,
        title,
        total_items: DEFAULT_CHECKLIST_ITEMS.length,
      })
      .select()
      .single()

    if (sessionError) {
      console.error("Erro ao criar sessão:", sessionError)
      return res.status(500).json({ error: "Erro interno do servidor" })
    }

    // Criar itens padrão
    const itemsToInsert = DEFAULT_CHECKLIST_ITEMS.map((item) => ({
      session_id: session.id,
      item_id: item.item_id,
      category: item.category,
      text: item.text,
      checked: false,
    }))

    const { error: itemsError } = await supabase
      .from("checklist_items")
      .insert(itemsToInsert)

    if (itemsError) {
      console.error("Erro ao criar itens:", itemsError)
      // Não falhar se os itens não foram criados, apenas logar
    }

    res.json({ session })
  } catch (error) {
    console.error("Erro ao criar sessão:", error)
    res.status(500).json({ error: "Erro interno do servidor" })
  }
})

// GET /api/v1/checklist/sessions/:id - Buscar sessão com itens
/**
 * @param {import('express').Request & { user?: { id: string, email: string, role: string } }} req
 * @param {import('express').Response} res
 */
router.get("/sessions/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id
    const sessionId = req.params.id

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" })
    }

    // Buscar sessão
    const { data: session, error: sessionError } = await supabase
      .from("checklist_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .single()

    if (sessionError || !session) {
      return res.status(404).json({ error: "Sessão não encontrada" })
    }

    // Buscar itens
    const { data: items, error: itemsError } = await supabase
      .from("checklist_items")
      .select("*")
      .eq("session_id", sessionId)
      .order("item_id")

    if (itemsError) {
      console.error("Erro ao buscar itens:", itemsError)
      return res.status(500).json({ error: "Erro interno do servidor" })
    }

    res.json({
      session: {
        ...session,
        items: items || [],
      },
    })
  } catch (error) {
    console.error("Erro ao buscar sessão:", error)
    res.status(500).json({ error: "Erro interno do servidor" })
  }
})

// PUT /api/v1/checklist/sessions/:id/items/:itemId - Atualizar item
/**
 * @param {import('express').Request & { user?: { id: string, email: string, role: string } }} req
 * @param {import('express').Response} res
 */
router.put(
  "/sessions/:id/items/:itemId",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user?.id
      const sessionId = req.params.id
      const itemId = req.params.itemId
      const { checked }: UpdateChecklistItemRequest = req.body

      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" })
      }

      // Verificar se a sessão pertence ao usuário
      const { data: session, error: sessionError } = await supabase
        .from("checklist_sessions")
        .select("id")
        .eq("id", sessionId)
        .eq("user_id", userId)
        .single()

      if (sessionError || !session) {
        return res.status(404).json({ error: "Sessão não encontrada" })
      }

      // Verificar se o item existe
      const { data: existingItem, error: checkError } = await supabase
        .from("checklist_items")
        .select("*")
        .eq("session_id", sessionId)
        .eq("item_id", itemId)
        .single()

      let item
      let itemError

      if (checkError && checkError.code === "PGRST116") {
        // Item não existe, criar novo
        const { data: newItem, error: createError } = await supabase
          .from("checklist_items")
          .insert({
            session_id: sessionId,
            item_id: itemId,
            category: getCategoryFromItemId(itemId),
            text: getItemText(itemId),
            checked,
          })
          .select()
          .single()

        item = newItem
        itemError = createError
      } else if (checkError) {
        // Outro erro
        itemError = checkError
      } else {
        // Item existe, atualizar
        const { data: updatedItem, error: updateError } = await supabase
          .from("checklist_items")
          .update({ checked })
          .eq("session_id", sessionId)
          .eq("item_id", itemId)
          .select()
          .single()

        item = updatedItem
        itemError = updateError
      }

      if (itemError) {
        console.error("Erro ao atualizar item:", itemError)
        return res.status(500).json({ error: "Erro interno do servidor" })
      }

      res.json({ item })
    } catch (error) {
      console.error("Erro ao atualizar item:", error)
      res.status(500).json({ error: "Erro interno do servidor" })
    }
  }
)

// DELETE /api/v1/checklist/sessions/:id - Deletar sessão
/**
 * @param {import('express').Request & { user?: { id: string, email: string, role: string } }} req
 * @param {import('express').Response} res
 */
router.delete("/sessions/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id
    const sessionId = req.params.id

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" })
    }

    // Verificar se a sessão pertence ao usuário
    const { data: session, error: sessionError } = await supabase
      .from("checklist_sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .single()

    if (sessionError || !session) {
      return res.status(404).json({ error: "Sessão não encontrada" })
    }

    // Deletar sessão (itens serão deletados automaticamente por CASCADE)
    const { error: deleteError } = await supabase
      .from("checklist_sessions")
      .delete()
      .eq("id", sessionId)

    if (deleteError) {
      console.error("Erro ao deletar sessão:", deleteError)
      return res.status(500).json({ error: "Erro interno do servidor" })
    }

    res.json({ success: true })
  } catch (error) {
    console.error("Erro ao deletar sessão:", error)
    res.status(500).json({ error: "Erro interno do servidor" })
  }
})

module.exports = router

const express = require("express")
const authenticateToken = require("../middleware/auth")
const { supabase } = require("../config/supabase")
// Make this file a module for TypeScript
export {}

/**
 * Definição local do tipo AuthenticatedRequest para compatibilidade
 */
/**
 * @typedef {import('express').Request & { user?: { id: string, email: string, role: string } }} AuthenticatedRequest
 */

const router = express.Router()

// GET /api/v1/chat-sessions - Listar sessões do usuário
/**
 * @param {import('express').Request & { user?: { id: string, email: string, role: string } }} req
 * @param {import('express').Response} res
 */
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" })
    }

    const { data: sessions, error } = await supabase
      .from("chat_sessions")
      .select(
        `
        id,
        title,
        flow,
        created_at,
        updated_at,
        chat_messages (
          id,
          role,
          content,
          timestamp
        )
      `
      )
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })

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

// POST /api/v1/chat-sessions - Criar nova sessão
/**
 * @param {import('express').Request & { user?: { id: string, email: string, role: string } }} req
 * @param {import('express').Response} res
 */
router.post("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id
    const { title, flow = "admin", initialMessage } = req.body

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" })
    }

    if (!title) {
      return res.status(400).json({ error: "Título é obrigatório" })
    }

    // Criar sessão
    const { data: session, error: sessionError } = await supabase
      .from("chat_sessions")
      .insert({
        user_id: userId,
        title,
        flow,
      })
      .select()
      .single()

    if (sessionError) {
      console.error("Erro ao criar sessão:", sessionError)
      return res.status(500).json({ error: "Erro interno do servidor" })
    }

    // Se há mensagem inicial, salvá-la
    if (initialMessage) {
      const { error: messageError } = await supabase
        .from("chat_messages")
        .insert({
          session_id: session.id,
          role: "user",
          content: initialMessage,
        })

      if (messageError) {
        console.error("Erro ao salvar mensagem inicial:", messageError)
      }
    }

    res.json({ session })
  } catch (error) {
    console.error("Erro ao criar sessão:", error)
    res.status(500).json({ error: "Erro interno do servidor" })
  }
})

// POST /api/v1/chat-sessions/:id/messages - Adicionar mensagem à sessão
/**
 * @param {import('express').Request & { user?: { id: string, email: string, role: string } }} req
 * @param {import('express').Response} res
 */
router.post("/:id/messages", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id
    const sessionId = req.params.id
    const { role, content } = req.body

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" })
    }

    if (!role || !content) {
      return res.status(400).json({ error: "Role e content são obrigatórios" })
    }

    // Verificar se a sessão pertence ao usuário
    const { data: session, error: sessionError } = await supabase
      .from("chat_sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .single()

    if (sessionError || !session) {
      return res.status(404).json({ error: "Sessão não encontrada" })
    }

    // Salvar mensagem
    const { data: message, error: messageError } = await supabase
      .from("chat_messages")
      .insert({
        session_id: sessionId,
        role,
        content,
      })
      .select()
      .single()

    if (messageError) {
      console.error("Erro ao salvar mensagem:", messageError)
      return res.status(500).json({ error: "Erro interno do servidor" })
    }

    // Atualizar updated_at da sessão
    await supabase
      .from("chat_sessions")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", sessionId)

    res.json({ message })
  } catch (error) {
    console.error("Erro ao adicionar mensagem:", error)
    res.status(500).json({ error: "Erro interno do servidor" })
  }
})

// GET /api/v1/chat-sessions/:id/messages - Buscar mensagens de uma sessão
/**
 * @param {import('express').Request & { user?: { id: string, email: string, role: string } }} req
 * @param {import('express').Response} res
 */
router.get("/:id/messages", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id
    const sessionId = req.params.id

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" })
    }

    // Verificar se a sessão pertence ao usuário
    const { data: session, error: sessionError } = await supabase
      .from("chat_sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .single()

    if (sessionError || !session) {
      return res.status(404).json({ error: "Sessão não encontrada" })
    }

    // Buscar mensagens da sessão
    const { data: messages, error: messagesError } = await supabase
      .from("chat_messages")
      .select("id, role, content, timestamp")
      .eq("session_id", sessionId)
      .order("timestamp", { ascending: true })

    if (messagesError) {
      console.error("Erro ao buscar mensagens:", messagesError)
      return res.status(500).json({ error: "Erro interno do servidor" })
    }

    res.json({ messages: messages || [] })
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error)
    res.status(500).json({ error: "Erro interno do servidor" })
  }
})

// DELETE /api/v1/chat-sessions/:id - Deletar sessão
/**
 * @param {import('express').Request & { user?: { id: string, email: string, role: string } }} req
 * @param {import('express').Response} res
 */
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id
    const sessionId = req.params.id

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" })
    }

    // Verificar se a sessão pertence ao usuário
    const { data: session, error: sessionError } = await supabase
      .from("chat_sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .single()

    if (sessionError || !session) {
      return res.status(404).json({ error: "Sessão não encontrada" })
    }

    // Deletar sessão (as mensagens serão deletadas automaticamente pelo CASCADE)
    const { error: deleteError } = await supabase
      .from("chat_sessions")
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

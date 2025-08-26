const express = require("express")
import { Request, Response } from "express"
import { supabase } from "../config/supabase"
const authenticateToken = require("../middleware/auth")
/**
 * @typedef {import('express').Request & { user?: { id: string, email: string, role: string } }} AuthenticatedRequest
 */

const router = express.Router()

// POST /api/v1/rooms/create-user-and-room - Criar usuário e sala via API
router.post("/create-user-and-room", async (req: Request, res: Response) => {
  try {
    const { name, email, whatsapp, city, state } = req.body

    if (!name || !email) {
      return res.status(400).json({ error: "Nome e email são obrigatórios" })
    }

    // 1. Gerar senha temporária
    const tempPassword =
      Math.random().toString(36).slice(-8) +
      Math.random().toString(36).slice(-8)

    // 2. Criar usuário no Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          first_name: name.split(" ")[0],
          last_name: name.split(" ").slice(1).join(" "),
          whatsapp: whatsapp,
          city: city,
          state: state,
        },
      })

    if (authError || !authData.user) {
      console.error("Error creating user:", authError)
      return res.status(500).json({ error: "Erro ao criar usuário" })
    }

    // 3. Aguardar trigger criar perfil e atualizar role
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const { error: updateError } = await supabase
      .from("users")
      .update({ role: "host" })
      .eq("id", authData.user.id)

    if (updateError) {
      console.warn("Warning: Could not update user role to host:", updateError)
    }

    // 4. Gerar código de convite único
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase()

    // 5. Criar sala segura
    const { data: roomData, error: roomError } = await supabase
      .from("rooms")
      .insert({
        title: `Sala Segura - ${name}`,
        status: "active",
        created_by: authData.user.id,
        invite_code: inviteCode,
      })
      .select()
      .single()

    if (roomError || !roomData) {
      console.error("Error creating room:", roomError)
      return res.status(500).json({ error: "Erro ao criar sala" })
    }

    // 6. Adicionar usuário como participante da sala
    const { error: participantError } = await supabase
      .from("room_participants")
      .insert({
        room_id: roomData.id,
        user_id: authData.user.id,
        role: "host",
        status: "active",
      })

    if (participantError) {
      console.error("Error creating room participant:", participantError)
    }

    res.json({
      success: true,
      data: {
        userId: authData.user.id,
        roomId: roomData.id,
        inviteCode,
        tempPassword,
        redirectUrl: `https://app-salasegura.vandessonsantiago.com/room/${roomData.id}`,
      },
    })
  } catch (error) {
    console.error("Error creating user and room:", error)
    res.status(500).json({ error: "Erro interno do servidor" })
  }
})

// GET /api/v1/rooms - Listar salas do usuário
/**
 * @param {import('express').Request & { user?: { id: string, email: string, role: string } }} req
 * @param {import('express').Response} res
 */
router.get("/", authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const { data: rooms, error } = await supabase
      .from("rooms")
      .select(
        `
        *,
        room_participants!inner(user_id),
        participants:room_participants(
          id,
          role,
          status,
          joined_at,
          users(id, first_name, last_name, email)
        )
      `
      )
      .eq("room_participants.user_id", req.user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching rooms:", error)
      return res.status(500).json({ error: "Erro ao buscar salas" })
    }

    res.json(rooms || [])
  } catch (error) {
    console.error("Error fetching rooms:", error)
    res.status(500).json({ error: "Erro interno do servidor" })
  }
})

// GET /api/v1/rooms/:id - Buscar sala específica
/**
 * @param {import('express').Request & { user?: { id: string, email: string, role: string } }} req
 * @param {import('express').Response} res
 */
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const { id } = req.params

    const { data: room, error } = await supabase
      .from("rooms")
      .select(
        `
        *,
        participants:room_participants(
          id,
          role,
          status,
          joined_at,
          users(id, first_name, last_name, email)
        )
      `
      )
      .eq("id", id)
      .eq("room_participants.user_id", req.user.id)
      .single()

    if (error || !room) {
      return res.status(404).json({ error: "Sala não encontrada" })
    }

    res.json(room)
  } catch (error) {
    console.error("Error fetching room:", error)
    res.status(500).json({ error: "Erro interno do servidor" })
  }
})

// POST /api/v1/rooms/:id/join - Entrar em sala via código
/**
 * @param {import('express').Request & { user?: { id: string, email: string, role: string } }} req
 * @param {import('express').Response} res
 */
router.post("/:id/join", authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const { id } = req.params
    const { inviteCode } = req.body

    if (!inviteCode) {
      return res.status(400).json({ error: "Código de convite é obrigatório" })
    }

    // Verificar se a sala existe e o código está correto
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", id)
      .eq("invite_code", inviteCode)
      .single()

    if (roomError || !room) {
      return res
        .status(404)
        .json({ error: "Sala não encontrada ou código inválido" })
    }

    // Verificar se o usuário já é participante
    const { data: existingParticipant } = await supabase
      .from("room_participants")
      .select("*")
      .eq("room_id", id)
      .eq("user_id", req.user.id)
      .single()

    if (existingParticipant) {
      return res
        .status(400)
        .json({ error: "Você já é participante desta sala" })
    }

    // Adicionar usuário como participante
    const { error: participantError } = await supabase
      .from("room_participants")
      .insert({
        room_id: id,
        user_id: req.user.id,
        role: "guest",
        status: "active",
      })

    if (participantError) {
      console.error("Error joining room:", participantError)
      return res.status(500).json({ error: "Erro ao entrar na sala" })
    }

    res.json({
      success: true,
      message: "Entrou na sala com sucesso",
      room,
    })
  } catch (error) {
    console.error("Error joining room:", error)
    res.status(500).json({ error: "Erro interno do servidor" })
  }
})

// GET /api/v1/rooms/:id/processes - Buscar processos de uma sala
/**
 * @param {import('express').Request & { user?: { id: string, email: string, role: string } }} req
 * @param {import('express').Response} res
 */
router.get("/:id/processes", authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const { id } = req.params

    // Verificar se o usuário é participante da sala
    const { data: participant, error: participantError } = await supabase
      .from("room_participants")
      .select("*")
      .eq("room_id", id)
      .eq("user_id", req.user.id)
      .single()

    if (participantError || !participant) {
      return res
        .status(403)
        .json({ error: "Acesso negado - você não é participante desta sala" })
    }

    // Buscar processos da sala
    const { data: processes, error } = await supabase
      .from("processes")
      .select("*")
      .eq("room_id", id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching processes:", error)
      return res.status(500).json({ error: "Erro ao buscar processos" })
    }

    res.json(processes || [])
  } catch (error) {
    console.error("Error fetching processes:", error)
    res.status(500).json({ error: "Erro interno do servidor" })
  }
})

module.exports = router

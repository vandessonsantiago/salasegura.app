const express = require("express")
import { Response } from "express"
import { supabase } from "../config/supabase"
const authenticateToken = require("../middleware/auth")
/**
 * @typedef {import('express').Request & { user?: { id: string, email: string, role: string } }} AuthenticatedRequest
 */

const router = express.Router()

// GET /api/v1/processes
/**
 * @param {import('express').Request & { user?: { id: string, email: string, role: string } }} req
 * @param {import('express').Response} res
 */
router.get("/", authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const { data, error } = await supabase
      .from("processes")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Supabase error:", error)
      return res.status(500).json({ error: "Database error" })
    }

    res.json(data || [])
  } catch (error) {
    console.error("Error fetching processes:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// POST /api/v1/processes
/**
 * @param {import('express').Request & { user?: { id: string, email: string, role: string } }} req
 * @param {import('express').Response} res
 */
router.post("/", authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const { title, description, priority, roomId } = req.body

    if (!title || !description || !roomId) {
      return res
        .status(400)
        .json({ error: "Título, descrição e sala são obrigatórios" })
    }

    // Verificar se o usuário é participante da sala
    const { data: participant, error: participantError } = await supabase
      .from("room_participants")
      .select("*")
      .eq("room_id", roomId)
      .eq("user_id", req.user.id)
      .single()

    if (participantError || !participant) {
      return res
        .status(403)
        .json({ error: "Acesso negado - você não é participante desta sala" })
    }

    const { data, error } = await supabase
      .from("processes")
      .insert([
        {
          title,
          description,
          priority: priority || "medium",
          status: "pending",
          room_id: roomId,
          user_id: req.user.id,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return res.status(500).json({ error: "Database error" })
    }

    res.status(201).json(data)
  } catch (error) {
    console.error("Error creating process:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// PUT /api/v1/processes/:id
/**
 * @param {import('express').Request & { user?: { id: string, email: string, role: string } }} req
 * @param {import('express').Response} res
 */
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const { id } = req.params

    const { data, error } = await supabase
      .from("processes")
      .update(req.body)
      .eq("id", id)
      .eq("user_id", req.user.id)
      .select()
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return res.status(500).json({ error: "Database error" })
    }

    if (!data) {
      return res.status(404).json({ error: "Process not found" })
    }

    res.json(data)
  } catch (error) {
    console.error("Error updating process:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// DELETE /api/v1/processes/:id
/**
 * @param {import('express').Request & { user?: { id: string, email: string, role: string } }} req
 * @param {import('express').Response} res
 */
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const { id } = req.params

    const { error } = await supabase
      .from("processes")
      .delete()
      .eq("id", id)
      .eq("user_id", req.user.id)

    if (error) {
      console.error("Supabase error:", error)
      return res.status(500).json({ error: "Database error" })
    }

    res.json({ message: "Process deleted successfully" })
  } catch (error) {
    console.error("Error deleting process:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

module.exports = router

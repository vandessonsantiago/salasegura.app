const express = require("express")
const { createClient } = require("@supabase/supabase-js")
const authenticateToken = require("../middleware/auth")
// Make this file a module for TypeScript
export {}
/**
 * @typedef {import('express').Request & { user?: { id: string, email: string, role: string } }} AuthenticatedRequest
 */
// Se precisar do tipo User, use require ou defina localmente

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const router = express.Router()

// GET /api/v1/user/profile
/**
 * @param {import('express').Request & { user?: { id: string, email: string, role: string } }} req
 * @param {import('express').Response} res
 */
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    // Buscar dados completos do usuário no Supabase
    const { data: userProfile, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.user.id)
      .single()

    if (error) {
      console.error("Error fetching user profile:", error)
      return res.status(500).json({ error: "Internal server error" })
    }

    // Retornar dados formatados
    /**
     * @type {{ id: string, email: string, first_name?: string, last_name?: string, role: string, created_at: string }}
     */
    const profile = {
      id: req.user.id,
      email: req.user.email,
      first_name: userProfile?.first_name,
      last_name: userProfile?.last_name,
      role: userProfile?.role || "user",
      created_at: userProfile?.created_at || new Date().toISOString(),
    }

    res.json(profile)
  } catch (error) {
    console.error("Error fetching user profile:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

module.exports = router

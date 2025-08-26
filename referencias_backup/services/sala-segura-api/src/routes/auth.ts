const express = require("express")
const { supabase } = require("../config/supabase")
// Make this file a module for TypeScript
export {}
/** @type {import('express').Request} */
const expressTypes = require("express")

/** @type {import('express').Router} */
const router = express.Router()

// Rota para login
router.post("/login", async (req, res) => {
  try {
    /** @type {{ email?: string, password?: string }} */
    const { email, password } = req.body || {}

    if (!email || !password) {
      return res.status(400).json({ error: "Email e senha são obrigatórios" })
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("Login error:", error)
      return res.status(401).json({ error: "Credenciais inválidas" })
    }

    return res.json({
      success: true,
      user: data.user,
      session: data.session,
    })
  } catch (error) {
    console.error("Login error:", error)
    return res.status(500).json({ error: "Erro interno do servidor" })
  }
})

// Rota para registro
router.post("/register", async (req, res) => {
  try {
    /** @type {{ email?: string, password?: string, firstName?: string, lastName?: string }} */
    const { email, password, firstName, lastName } = req.body || {}

    if (!email || !password) {
      return res.status(400).json({ error: "Email e senha são obrigatórios" })
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    })

    if (error) {
      console.error("Registration error:", error)
      return res.status(400).json({ error: error.message })
    }

    // Criar perfil do usuário na tabela users
    if (data.user) {
      const { error: profileError } = await supabase.from("users").insert({
        id: data.user.id,
        email: data.user.email,
        first_name: firstName,
        last_name: lastName,
        role: "user",
      })

      if (profileError) {
        console.error("Profile creation error:", profileError)
      }
    }

    return res.json({
      success: true,
      user: data.user,
      message: "Usuário criado com sucesso",
    })
  } catch (error) {
    console.error("Registration error:", error)
    return res.status(500).json({ error: "Erro interno do servidor" })
  }
})

// Rota para logout
router.post("/logout", async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("Logout error:", error)
      return res.status(500).json({ error: "Erro ao fazer logout" })
    }

    return res.json({ success: true, message: "Logout realizado com sucesso" })
  } catch (error) {
    console.error("Logout error:", error)
    return res.status(500).json({ error: "Erro interno do servidor" })
  }
})

// Rota para verificar sessão
router.get("/session", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"]

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token não fornecido" })
    }

    const token = authHeader.substring(7)
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token)

    if (error || !user) {
      return res.status(401).json({ error: "Sessão inválida" })
    }

    return res.json({ success: true, user })
  } catch (error) {
    console.error("Session check error:", error)
    return res.status(500).json({ error: "Erro interno do servidor" })
  }
})

// Rota para redefinir senha
router.post("/reset-password", async (req, res) => {
  try {
    /** @type {{ email?: string }} */
    const { email } = req.body || {}

    if (!email) {
      return res.status(400).json({ error: "Email é obrigatório" })
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
    })

    if (error) {
      console.error("Password reset error:", error)
      return res.status(400).json({ error: error.message })
    }

    return res.json({ success: true, message: "Email de redefinição enviado" })
  } catch (error) {
    console.error("Password reset error:", error)
    return res.status(500).json({ error: "Erro interno do servidor" })
  }
})

// Rota para atualizar senha
router.post("/update-password", async (req, res) => {
  try {
    /** @type {{ password?: string }} */
    const { password } = req.body || {}
    const authHeader = req.headers["authorization"]

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token não fornecido" })
    }

    const token = authHeader.substring(7)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return res.status(401).json({ error: "Token inválido" })
    }

    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      password: password,
    })

    if (error) {
      console.error("Password update error:", error)
      return res.status(400).json({ error: error.message })
    }

    return res.json({ success: true, message: "Senha atualizada com sucesso" })
  } catch (error) {
    console.error("Password update error:", error)
    return res.status(500).json({ error: "Erro interno do servidor" })
  }
})

module.exports = router

const express = require("express")
const { createClient } = require("@supabase/supabase-js")
const crypto = require("crypto")
// Make this file a module for TypeScript
export {}

const router = express.Router()

// Inicializar cliente Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

// POST /conversions - Processar formulário de conversão
router.post("/", async (req, res) => {
  try {
    const { name, email, whatsapp } = req.body

    // Validação básica
    if (!name || !email || !whatsapp) {
      return res.status(400).json({
        error: "Todos os campos são obrigatórios",
      })
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: "Formato de email inválido",
      })
    }

    // Verificar se o email já está cadastrado no Supabase
    console.log("🔍 Verificando se email já está cadastrado:", email)
    const { data: users, error: searchError } =
      await supabase.auth.admin.listUsers()

    if (searchError) {
      console.error("Erro ao buscar usuários:", searchError)
      return res.status(500).json({
        error: "Erro interno do servidor",
      })
    }

    const existingUser = users.users.find((u) => u.email === email)

    if (existingUser) {
      console.log("✅ Email já cadastrado encontrado:", email)
      return res.status(200).json({
        success: true,
        emailExists: true,
        message: "Email já cadastrado no sistema",
        user: {
          email: existingUser.email,
          name: existingUser.user_metadata?.name || name,
        },
      })
    }

    console.log("✅ Email não cadastrado, prosseguindo com conversão")
    // Gerar token de acesso único
    const accessToken = crypto.randomBytes(32).toString("hex")

    // Inserir dados no Supabase
    const { data, error } = await supabase
      .from("conversions")
      .insert({
        name,
        email,
        whatsapp,
        access_token: accessToken,
      })
      .select()
      .single()

    if (error) {
      console.error("Erro ao inserir conversão:", error)
      return res.status(500).json({
        error: "Erro interno do servidor",
      })
    }

    // Retornar sucesso com token de acesso
    res.status(201).json({
      success: true,
      message: "Formulário enviado com sucesso!",
      accessToken,
      redirectUrl: `${process.env.FRONTEND_URL}/admin/register?token=${accessToken}`,
    })
  } catch (error) {
    console.error("Erro no processamento do formulário:", error)
    res.status(500).json({
      error: "Erro interno do servidor",
    })
  }
})

// GET /conversions/:token - Validar token de acesso
router.get("/:token", async (req, res) => {
  try {
    const { token } = req.params

    // Buscar conversão pelo token
    const { data, error } = await supabase
      .from("conversions")
      .select("*")
      .eq("access_token", token)
      .eq("status", "pending")
      .single()

    if (error || !data) {
      return res.status(404).json({
        error: "Token inválido ou expirado",
      })
    }

    // Retornar dados da conversão (sem informações sensíveis)
    res.json({
      success: true,
      conversion: {
        id: data.id,
        name: data.name,
        email: data.email,
        status: data.status,
        createdAt: data.created_at,
      },
    })
  } catch (error) {
    console.error("Erro ao validar token:", error)
    res.status(500).json({
      error: "Erro interno do servidor",
    })
  }
})

module.exports = router

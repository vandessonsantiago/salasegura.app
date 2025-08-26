const { supabase } = require("../config/supabase")
// Make this file a module for TypeScript (prevents global scope merging)
export {}

/**
 * Middleware de autenticação para Express (CommonJS)
 */
module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(" ")[1]

    if (!token) {
      res.status(401).json({ error: "Access token required" })
      return
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token)

    if (error || !user) {
      res.status(403).json({ error: "Invalid or expired token" })
      return
    }

    // Adicionar usuário ao request
    req.user = {
      id: user.id,
      email: user.email || "",
      role: user.user_metadata?.role || "user",
    }

    next()
  } catch (error) {
    console.error("Auth middleware error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

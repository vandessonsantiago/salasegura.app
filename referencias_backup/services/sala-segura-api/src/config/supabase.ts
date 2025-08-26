const { createClient } = require("@supabase/supabase-js")
// biome-ignore assist/source/organizeImports: // biome-ignore
import * as dotenv from "dotenv"

dotenv.config()

// Configuração do Supabase via variáveis de ambiente (sem fallbacks inseguros)
const supabaseUrl = process.env.SUPABASE_URL
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY

if (!supabaseSecretKey)
  throw new Error("Missing SUPABASE_SECRET_KEY environment variable")
if (!supabaseUrl) throw new Error("Missing SUPABASE_URL environment variable")

export const supabase = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Cliente para operações do usuário (com JWT do Supabase)
export const createUserClient = (accessToken: string) => {
  return createClient(supabaseUrl, supabaseSecretKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  })
}

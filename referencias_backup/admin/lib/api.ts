const getDefaultBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL
  if (process.env.NODE_ENV === "production") {
    // fallback para domínio customizado em produção
    return "https://api-salasegura.vandessonsantiago.com"
  }
  // em dev, tentar usar localhost
  return "http://localhost:3002"
}

const API_BASE_URL = getDefaultBaseUrl()

export const api = {
  baseUrl: API_BASE_URL,

  // Função para fazer requisições autenticadas
  async fetch(endpoint: string, options: RequestInit = {}) {
    // Remove leading slash from endpoint if present
    const cleanEndpoint = endpoint.startsWith("/")
      ? endpoint.slice(1)
      : endpoint
    const url = `${API_BASE_URL}/${cleanEndpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `API Error: ${response.status} ${response.statusText} - ${errorText}`
      )
    }

    return response.json()
  },

  // Função para requisições autenticadas com token do Supabase
  async fetchWithAuth(
    endpoint: string,
    token: string,
    options: RequestInit = {}
  ) {
    return this.fetch(endpoint, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    })
  },
}

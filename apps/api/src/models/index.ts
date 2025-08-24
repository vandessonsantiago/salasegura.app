// Interface para representar uma mensagem
export interface Message {
  id?: string;
  content: string;
  sender: string;
  timestamp: Date;
}

// Interface para resposta de health check
export interface HealthStatus {
  ok: boolean;
  timestamp: string;
  uptime: number;
  version: string;
}

// Interface para resposta de API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    statusCode: number;
  };
}

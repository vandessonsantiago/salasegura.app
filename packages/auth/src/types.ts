export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
  email_confirmed_at?: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: User;
}

export interface AuthError {
  message: string;
  code?: string;
}

export interface AuthResponse {
  data: AuthSession | null;
  error: AuthError | null;
}

// Tipos para requests da API
export interface SignInRequest {
  email: string;
  password: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
}

export interface AuthHeaders {
  authorization: string;
}

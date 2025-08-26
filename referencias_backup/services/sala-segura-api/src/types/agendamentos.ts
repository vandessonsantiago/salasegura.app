export interface Agendamento {
  id: string
  user_id: string
  data: string
  horario: string
  status: "PENDING" | "CONFIRMED" | "CANCELLED"
  payment_id?: string
  payment_status: "PENDING" | "CONFIRMED" | "CANCELLED"
  valor: number
  descricao: string
  cliente_nome: string
  cliente_email: string
  cliente_telefone: string
  qr_code_pix?: string
  copy_paste_pix?: string
  pix_expires_at?: string
  calendar_event_id?: string
  google_meet_link?: string
  created_at: string
  updated_at: string
}

export interface CreateAgendamentoRequest {
  data: string
  horario: string
  valor: number
  descricao: string
  cliente_nome: string
  cliente_email: string
  cliente_telefone: string
  payment_id?: string
  qr_code_pix?: string
  copy_paste_pix?: string
  pix_expires_at?: string
  calendar_event_id?: string
  google_meet_link?: string
}

export interface UpdateAgendamentoRequest {
  data?: string
  horario?: string
  status?: "PENDING" | "CONFIRMED" | "CANCELLED"
  payment_status?: "PENDING" | "CONFIRMED" | "CANCELLED"
  qr_code_pix?: string
  copy_paste_pix?: string
  pix_expires_at?: string
  calendar_event_id?: string
  google_meet_link?: string
}

export interface AgendamentoResponse {
  success: boolean
  data?: Agendamento
  message?: string
  error?: string
}

export interface AgendamentosResponse {
  success: boolean
  data?: Agendamento[]
  message?: string
  error?: string
}

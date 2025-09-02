// =====================================================
// MÓDULO AGENDAMENTOS - TIPOS TYPESCRIPT
// =====================================================

export interface AgendamentoData {
  id?: string;
  user_id: string;
  data?: string;
  horario?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_id?: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  valor: number;
  descricao: string;
  cliente_nome?: string;
  cliente_email?: string;
  cliente_telefone?: string;
  qr_code_pix?: string;
  copy_paste_pix?: string;
  pix_expires_at?: string;
  calendar_event_id?: string;
  google_meet_link?: string;
  google_meet_link_type?: string;
  service_type?: string;
  service_data?: any;
  created_at?: string;
  updated_at?: string;
}

export interface ClienteData {
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
}

export interface AgendamentoInsert {
  user_id: string;
  data: string;
  horario: string;
  valor: number;
  descricao: string;
  cliente_nome?: string;
  cliente_email?: string;
  cliente_telefone?: string;
  service_type?: string;
  service_data?: any;
  calendar_event_id?: string;
  google_meet_link?: string;
}

export interface AgendamentoUpdate {
  data?: string;
  horario?: string;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
  valor?: number;
  descricao?: string;
  cliente_nome?: string;
  cliente_email?: string;
  cliente_telefone?: string;
  calendar_event_id?: string;
  google_meet_link?: string;
  google_meet_link_type?: string;
  service_data?: any;
  payment_id?: string;
  qr_code_pix?: string;
  copy_paste_pix?: string;
  pix_expires_at?: string;
}

export interface AgendamentoStats {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  totalRevenue: number;
}

export interface AgendamentoApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    statusCode: number;
  };
}

export interface AgendamentoListResponse {
  agendamentos: AgendamentoData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats?: AgendamentoStats;
}

export interface CreateAgendamentoRequest {
  data: string;
  horario: string;
  valor: number;
  descricao: string;
  cliente_nome?: string;
  cliente_email?: string;
  cliente_telefone?: string;
  service_type?: string;
  service_data?: any;
}

export interface UpdateAgendamentoRequest {
  data?: string;
  horario?: string;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  valor?: number;
  descricao?: string;
  cliente_nome?: string;
  cliente_email?: string;
  cliente_telefone?: string;
  service_data?: any;
}

export interface AgendamentoFilters {
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
  service_type?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

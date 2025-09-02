// MÓDULO DIVORCE - TIPOS TYPESCRIPT

export interface ClienteData {
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
}

export interface DivorceCaseData {
  id?: string;
  user_id: string;
  type: string;
  status: string;
  payment_id?: string;
  valor: number;
  qr_code_pix?: string;
  copy_paste_pix?: string;
  pix_expires_at?: string;
  cliente_nome?: string;
  cliente_email?: string;
  cliente_telefone?: string;
  service_data?: any;
  created_at?: string;
  updated_at?: string;
}

export interface DivorceCaseInsert {
  id?: string;
  user_id: string;
  type: string;
  status: string;
  valor: number;
  cliente_nome: string;
  cliente_email: string;
  cliente_telefone?: string;
  service_data?: any;
  created_at?: string;
  updated_at?: string;
}

export interface DivorceCaseUpdate {
  status?: string;
  payment_id?: string;
  qr_code_pix?: string;
  copy_paste_pix?: string;
  pix_expires_at?: string;
  cliente_nome?: string;
  cliente_email?: string;
  cliente_telefone?: string;
  service_data?: any;
  updated_at?: string;
}

export interface DivorceCaseStats {
  total: number;
  pending_payment: number;
  paid: number;
  completed: number;
  cancelled: number;
}

export interface DivorceApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface DivorceListResponse {
  cases: DivorceCaseData[];
  total: number;
  stats?: DivorceCaseStats;
}

export interface CreateDivorceCaseRequest {
  type: string;
  cliente: ClienteData;
  valor: number;
  descricao: string;
  serviceData?: any;
}

export interface UpdateDivorceCaseRequest {
  status?: string;
  cliente?: Partial<ClienteData>;
  serviceData?: any;
}

export interface DivorceFilters {
  status?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
}

// MÓDULO CHECKLIST DIVORCE - TIPOS TYPESCRIPT

export interface ChecklistTemplateItem {
  item_id: string;
  category: string;
  text: string;
  title: string;
}

export interface ChecklistSessionData {
  id?: string;
  user_id: string;
  title: string;
  progress: number;
  total_items: number;
  template_version: number;
  completed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ChecklistItemData {
  id?: string;
  session_id: string;
  item_id: string;
  category: string;
  text: string;
  title: string;
  status: 'pending' | 'completed' | 'skipped';
  notes?: string;
  completed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ChecklistSessionInsert {
  id?: string;
  user_id: string;
  title: string;
  progress?: number;
  total_items?: number;
  template_version?: number;
  completed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ChecklistItemInsert {
  id?: string;
  session_id: string;
  item_id: string;
  category: string;
  text: string;
  title: string;
  status?: 'pending' | 'completed' | 'skipped';
  notes?: string;
  completed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ChecklistSessionUpdate {
  title?: string;
  progress?: number;
  total_items?: number;
  template_version?: number;
  completed_at?: string;
  updated_at?: string;
}

export interface ChecklistItemUpdate {
  status?: 'pending' | 'completed' | 'skipped';
  notes?: string;
  completed_at?: string;
  updated_at?: string;
}

export interface ChecklistProgressStats {
  total: number;
  completed: number;
  pending: number;
  skipped: number;
  percentage: number;
}

export interface ChecklistApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ChecklistSessionResponse {
  session: ChecklistSessionData;
  items: ChecklistItemData[];
  stats: ChecklistProgressStats;
}

export interface ChecklistListResponse {
  sessions: ChecklistSessionData[];
  total: number;
}

export interface CreateChecklistSessionRequest {
  title: string;
  template_version?: number;
}

export interface UpdateChecklistItemRequest {
  status: 'pending' | 'completed' | 'skipped';
  notes?: string;
}

export interface ChecklistFilters {
  status?: 'active' | 'completed';
  template_version?: number;
  dateFrom?: string;
  dateTo?: string;
}

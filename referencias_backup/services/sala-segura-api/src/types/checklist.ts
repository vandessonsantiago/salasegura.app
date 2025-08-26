export interface ChecklistSession {
  id: string;
  user_id: string;
  title: string;
  progress: number;
  total_items: number;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  id: string;
  session_id: string;
  item_id: string;
  category: string;
  text: string;
  checked: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChecklistSessionWithItems extends ChecklistSession {
  items: ChecklistItem[];
}

export interface CreateChecklistSessionRequest {
  title?: string;
}

export interface UpdateChecklistItemRequest {
  checked: boolean;
}

export interface ChecklistProgress {
  progress: number;
  total_items: number;
  percentage: number;
}

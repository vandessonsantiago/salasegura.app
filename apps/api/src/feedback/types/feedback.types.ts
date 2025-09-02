export interface FeedbackData {
  type: 'problem' | 'suggestion';
  message: string;
}

export interface Feedback {
  id: number;
  user_id: string;
  type: string;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface FeedbackInsert {
  user_id: string;
  type: string;
  message: string;
  status?: string;
}

export interface FeedbackUpdate {
  type?: string;
  message?: string;
  status?: string;
}

export interface FeedbackStats {
  total: number;
  pending: number;
  reviewed: number;
  resolved: number;
  problems: number;
  suggestions: number;
}

export interface FeedbackPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface FeedbackListResponse {
  feedback: Feedback[];
  pagination: FeedbackPagination;
}

export interface FeedbackFilters {
  status?: 'pending' | 'reviewed' | 'resolved';
  type?: 'problem' | 'suggestion';
  page?: number;
  limit?: number;
}

export interface CreateFeedbackRequest {
  type: 'problem' | 'suggestion';
  message: string;
}

export interface UpdateFeedbackStatusRequest {
  status: 'pending' | 'reviewed' | 'resolved';
}

export interface FeedbackApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    statusCode: number;
  };
}

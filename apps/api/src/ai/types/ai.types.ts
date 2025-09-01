export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface UserContext {
  userProfile: any;
  activeAppointments: any[];
  divorceCases: any[];
  chatHistory: any[];
  preferences: any;
}

export interface LegalContext {
  topic: string;
  legislation: string[];
  complexity: 'basic' | 'intermediate' | 'advanced';
  urgency: 'low' | 'medium' | 'high';
}

export interface AIResponse {
  content: string;
  confidence: number;
  sources: string[];
  suggestions: string[];
  followUpQuestions: string[];
}

export interface ChatRequest {
  message: string;
  chatHistory?: ChatMessage[];
  conversationId?: string;
}

export interface LegalInfo {
  title: string;
  description?: string;
  legislation?: string;
  requirements?: string[];
  documents?: string[];
  timeline?: string;
  cost?: string;
  procedure?: string[];
  advantages?: string[];
  disadvantages?: string[];
}

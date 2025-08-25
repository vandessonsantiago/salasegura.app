import { Request, Response, NextFunction } from 'express';

// Tipos para Express
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: string;
  };
}

export interface AuthenticatedResponse extends Response {
  // Extensões específicas se necessário
}

export interface AuthenticatedNextFunction extends NextFunction {
  // Extensões específicas se necessário
}

// Tipos para Supabase
export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
}

// Tipos para Agendamentos
export interface Agendamento {
  id: string;
  user_id: string;
  data: string;
  horario: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';
  payment_status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';
  payment_id?: string;
  pix_expires_at?: string;
  calendar_event_id?: string;
  google_meet_link?: string;
  created_at: string;
  updated_at: string;
}

// Tipos para Google Calendar
export interface CalendarEvent {
  id: string;
  summary: string;
  description: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
  conferenceData?: {
    createRequest: {
      requestId: string;
      conferenceSolutionKey: {
        type: string;
      };
    };
  };
}

// Tipos para Asaas
export interface AsaasPayment {
  id: string;
  customer: string;
  paymentLink?: string;
  value: number;
  netValue: number;
  originalValue?: number;
  interestValue?: number;
  description: string;
  billingType: string;
  pixTransaction?: {
    encodedImage: string;
    payload: string;
    expiresAt: string;
  };
  status: string;
  dueDate: string;
  originalDueDate: string;
  paymentDate?: string;
  clientPaymentDate?: string;
  installmentNumber?: number;
  invoiceUrl: string;
  bankSlipUrl?: string;
  transactionReceiptUrl?: string;
  discount?: {
    value: number;
    dueDateLimitDays: number;
    type: string;
  };
  fine?: {
    value: number;
  };
  interest?: {
    value: number;
  };
  postalService: boolean;
  split?: Array<{
    walletId: string;
    fixedValue: number;
    percentualValue?: number;
    totalFixedValue?: number;
    totalPercentualValue?: number;
    grossValue: number;
    netValue: number;
    description: string;
    chargeFee: boolean;
  }>;
}

// Tipos para Chat
export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

// Tipos para Checklist
export interface ChecklistItem {
  id: string;
  session_id: string;
  title: string;
  description?: string;
  completed: boolean;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface ChecklistSession {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

// Tipos para Processes
export interface Process {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: 'active' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
}

// Tipos para Rooms
export interface Room {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// Tipos para Conversions
export interface Conversion {
  id: string;
  user_id: string;
  source: string;
  medium: string;
  campaign: string;
  term?: string;
  content?: string;
  created_at: string;
}

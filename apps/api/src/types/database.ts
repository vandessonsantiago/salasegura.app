// =====================================================
// TIPOS DO BANCO DE DADOS - SUPABASE ONLY
// =====================================================

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          bio: string | null;
          company: string | null;
          language: string | null;
          location: string | null;
          theme: string | null;
          timezone: string | null;
          website: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          bio?: string | null;
          company?: string | null;
          language?: string | null;
          location?: string | null;
          theme?: string | null;
          timezone?: string | null;
          website?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          bio?: string | null;
          company?: string | null;
          language?: string | null;
          location?: string | null;
          theme?: string | null;
          timezone?: string | null;
          website?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      conversions: {
        Row: {
          id: string;
          name: string;
          email: string;
          whatsapp: string;
          access_token: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          whatsapp: string;
          access_token: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          whatsapp?: string;
          access_token?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      checklist_sessions: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          progress: number;
          total_items: number;
          template_version: number;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          progress?: number;
          total_items?: number;
          template_version?: number;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          progress?: number;
          total_items?: number;
          template_version?: number;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      checklist_items: {
        Row: {
          id: string;
          session_id: string;
          item_id: string;
          category: string;
          text: string;
          checked: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          item_id: string;
          category: string;
          text: string;
          checked?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          item_id?: string;
          category?: string;
          text?: string;
          checked?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      agendamentos: {
        Row: {
          id: string;
          user_id: string;
          data: string;
          horario: string;
          status: string;
          payment_id: string | null;
          payment_status: string;
          valor: number;
          descricao: string;
          cliente_nome: string;
          cliente_email: string;
          cliente_telefone: string;
          qr_code_pix: string | null;
          copy_paste_pix: string | null;
          pix_expires_at: string | null;
          calendar_event_id: string | null;
          google_meet_link: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          data: string;
          horario: string;
          status?: string;
          payment_id?: string | null;
          payment_status?: string;
          valor: number;
          descricao: string;
          cliente_nome: string;
          cliente_email: string;
          cliente_telefone: string;
          qr_code_pix?: string | null;
          copy_paste_pix?: string | null;
          pix_expires_at?: string | null;
          calendar_event_id?: string | null;
          google_meet_link?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          data?: string;
          horario?: string;
          status?: string;
          payment_id?: string | null;
          payment_status?: string;
          valor?: number;
          descricao?: string;
          cliente_nome?: string;
          cliente_email?: string;
          cliente_telefone?: string;
          qr_code_pix?: string | null;
          copy_paste_pix?: string | null;
          pix_expires_at?: string | null;
          calendar_event_id?: string | null;
          google_meet_link?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          asaas_id: string;
          status: string;
          valor: number | null;
          user_id: string;
          agendamento_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          asaas_id: string;
          status: string;
          valor?: number | null;
          user_id: string;
          agendamento_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          asaas_id?: string;
          status?: string;
          valor?: number | null;
          user_id?: string;
          agendamento_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      webhook_logs: {
        Row: {
          id: string;
          asaas_event: string;
          payment_id: string | null;
          payload: any;
          processed_at: string;
          status: string;
          error_message: string | null;
        };
        Insert: {
          id?: string;
          asaas_event: string;
          payment_id?: string | null;
          payload: any;
          processed_at?: string;
          status?: string;
          error_message?: string | null;
        };
        Update: {
          id?: string;
          asaas_event?: string;
          payment_id?: string | null;
          payload?: any;
          processed_at?: string;
          status?: string;
          error_message?: string | null;
        };
      };
      app_settings: {
        Row: {
          id: string;
          key: string;
          value: string;
          type: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value: string;
          type?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          value?: string;
          type?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      activity_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          details: any;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          details?: any;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          details?: any;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
    };
  };
}

// =====================================================
// TIPOS DE RESPOSTA DAS QUERIES
// =====================================================

export type User = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert'];
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update'];

export type Conversion = Database['public']['Tables']['conversions']['Row'];
export type ConversionInsert = Database['public']['Tables']['conversions']['Insert'];
export type ConversionUpdate = Database['public']['Tables']['conversions']['Update'];

export type ChecklistSession = Database['public']['Tables']['checklist_sessions']['Row'];
export type ChecklistSessionInsert = Database['public']['Tables']['checklist_sessions']['Insert'];
export type ChecklistSessionUpdate = Database['public']['Tables']['checklist_sessions']['Update'];

export type ChecklistItem = Database['public']['Tables']['checklist_items']['Row'];
export type ChecklistItemInsert = Database['public']['Tables']['checklist_items']['Insert'];
export type ChecklistItemUpdate = Database['public']['Tables']['checklist_items']['Update'];

export type Agendamento = Database['public']['Tables']['agendamentos']['Row'];
export type AgendamentoInsert = Database['public']['Tables']['agendamentos']['Insert'];
export type AgendamentoUpdate = Database['public']['Tables']['agendamentos']['Update'];

export type Payment = Database['public']['Tables']['payments']['Row'];
export type PaymentInsert = Database['public']['Tables']['payments']['Insert'];
export type PaymentUpdate = Database['public']['Tables']['payments']['Update'];

export type WebhookLog = Database['public']['Tables']['webhook_logs']['Row'];
export type WebhookLogInsert = Database['public']['Tables']['webhook_logs']['Insert'];
export type WebhookLogUpdate = Database['public']['Tables']['webhook_logs']['Update'];

export type AppSetting = Database['public']['Tables']['app_settings']['Row'];
export type AppSettingInsert = Database['public']['Tables']['app_settings']['Insert'];
export type AppSettingUpdate = Database['public']['Tables']['app_settings']['Update'];

export type ActivityLog = Database['public']['Tables']['activity_logs']['Row'];
export type ActivityLogInsert = Database['public']['Tables']['activity_logs']['Insert'];
export type ActivityLogUpdate = Database['public']['Tables']['activity_logs']['Update'];

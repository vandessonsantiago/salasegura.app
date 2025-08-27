// =====================================================
// SERVICES - SUPABASE ONLY
// =====================================================

import { supabaseAdmin } from '../lib/supabase';
import type {
  User,
  UserInsert,
  UserUpdate,
  UserProfile,
  UserProfileInsert,
  UserProfileUpdate,
  Conversion,
  ConversionInsert,
  ConversionUpdate,
  ChecklistSession,
  ChecklistSessionInsert,
  ChecklistSessionUpdate,
  ChecklistItem,
  ChecklistItemInsert,
  ChecklistItemUpdate,
  Agendamento,
  AgendamentoInsert,
  AgendamentoUpdate,
  Payment,
  PaymentInsert,
  PaymentUpdate,
  WebhookLog,
  WebhookLogInsert,
  WebhookLogUpdate,
  AppSetting,
  AppSettingInsert,
  AppSettingUpdate,
  ActivityLog,
  ActivityLogInsert,
  ActivityLogUpdate
} from '../types/database';

// =====================================================
// USER SERVICE
// =====================================================

export class UserService {
  static async findById(id: string): Promise<User | null> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar usuário:', error);
      return null;
    }

    return data;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      console.error('Erro ao buscar usuário por email:', error);
      return null;
    }

    return data;
  }

  static async create(userData: UserInsert): Promise<User | null> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar usuário:', error);
      return null;
    }

    return data;
  }

  static async update(id: string, updates: UserUpdate): Promise<User | null> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar usuário:', error);
      return null;
    }

    return data;
  }

  static async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Erro ao buscar perfil:', error);
      return null;
    }

    return data;
  }

  static async createOrUpdateProfile(profileData: UserProfileInsert): Promise<UserProfile | null> {
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .upsert([profileData])
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar perfil:', error);
      return null;
    }

    return data;
  }
}

// =====================================================
// CONVERSION SERVICE
// =====================================================

export class ConversionService {
  static async create(conversionData: ConversionInsert): Promise<Conversion | null> {
    const { data, error } = await supabaseAdmin
      .from('conversions')
      .insert([conversionData])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar conversão:', error);
      return null;
    }

    return data;
  }

  static async findByToken(token: string): Promise<Conversion | null> {
    const { data, error } = await supabaseAdmin
      .from('conversions')
      .select('*')
      .eq('access_token', token)
      .single();

    if (error) {
      console.error('Erro ao buscar conversão por token:', error);
      return null;
    }

    return data;
  }

  static async updateStatus(id: string, status: string): Promise<Conversion | null> {
    const { data, error } = await supabaseAdmin
      .from('conversions')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar status da conversão:', error);
      return null;
    }

    return data;
  }
}

// =====================================================
// CHECKLIST SERVICE
// =====================================================

export class ChecklistService {
  static async createSession(sessionData: ChecklistSessionInsert): Promise<ChecklistSession | null> {
    const { data, error } = await supabaseAdmin
      .from('checklist_sessions')
      .insert([sessionData])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar sessão de checklist:', error);
      return null;
    }

    return data;
  }

  static async getSessionWithItems(sessionId: string, userId: string): Promise<{ session: ChecklistSession; items: ChecklistItem[] } | null> {
    // Buscar sessão
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('checklist_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (sessionError) {
      console.error('Erro ao buscar sessão:', sessionError);
      return null;
    }

    // Buscar itens
    const { data: items, error: itemsError } = await supabaseAdmin
      .from('checklist_items')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (itemsError) {
      console.error('Erro ao buscar itens:', itemsError);
      return null;
    }

    return { session, items: items || [] };
  }

  static async listSessions(userId: string): Promise<ChecklistSession[]> {
    const { data, error } = await supabaseAdmin
      .from('checklist_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao listar sessões:', error);
      return [];
    }

    return data || [];
  }

  static async updateItem(sessionId: string, itemId: string, checked: boolean): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('checklist_items')
      .update({
        checked,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .eq('item_id', itemId);

    if (error) {
      console.error('Erro ao atualizar item:', error);
      return false;
    }

    // Atualizar progresso da sessão
    await this.updateSessionProgress(sessionId);
    return true;
  }

  static async updateSessionProgress(sessionId: string): Promise<void> {
    // Contar itens totais e marcados
    const { data: items, error } = await supabaseAdmin
      .from('checklist_items')
      .select('checked')
      .eq('session_id', sessionId);

    if (error) {
      console.error('Erro ao contar itens:', error);
      return;
    }

    const totalItems = items?.length || 0;
    const checkedItems = items?.filter(item => item.checked).length || 0;
    const progress = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

    await supabaseAdmin
      .from('checklist_sessions')
      .update({
        progress,
        total_items: totalItems,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);
  }

  static async deleteSession(sessionId: string, userId: string): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('checklist_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', userId);

    if (error) {
      console.error('Erro ao deletar sessão:', error);
      return false;
    }

    return true;
  }
}

// =====================================================
// AGENDAMENTOS SERVICE
// =====================================================

export class AgendamentosService {
  static async create(agendamentoData: AgendamentoInsert): Promise<Agendamento | null> {
    const { data, error } = await supabaseAdmin
      .from('agendamentos')
      .insert([agendamentoData])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar agendamento:', error);
      return null;
    }

    return data;
  }

  static async getUserAgendamentos(userId: string): Promise<Agendamento[]> {
    const { data, error } = await supabaseAdmin
      .from('agendamentos')
      .select(`
        *,
        payments (
          id,
          asaas_id,
          status,
          valor,
          created_at
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar agendamentos:', error);
      return [];
    }

    return data || [];
  }

  static async updateStatus(id: string, status: string, userId: string): Promise<Agendamento | null> {
    const { data, error } = await supabaseAdmin
      .from('agendamentos')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar status do agendamento:', error);
      return null;
    }

    return data;
  }

  static async updatePaymentStatus(id: string, paymentStatus: string, userId: string): Promise<Agendamento | null> {
    const { data, error } = await supabaseAdmin
      .from('agendamentos')
      .update({
        payment_status: paymentStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar status de pagamento:', error);
      return null;
    }

    return data;
  }
}

// =====================================================
// PAYMENT SERVICE
// =====================================================

export class PaymentService {
  static async create(paymentData: PaymentInsert): Promise<Payment | null> {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .insert([paymentData])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar pagamento:', error);
      return null;
    }

    return data;
  }

  static async updatePaymentStatus(asaasId: string, status: string): Promise<Payment | null> {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('asaas_id', asaasId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar status do pagamento:', error);
      return null;
    }

    return data;
  }

  static async findByAsaasId(asaasId: string): Promise<Payment | null> {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('asaas_id', asaasId)
      .single();

    if (error) {
      console.error('Erro ao buscar pagamento por Asaas ID:', error);
      return null;
    }

    return data;
  }

  static async getUserPayments(userId: string): Promise<Payment[]> {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar pagamentos do usuário:', error);
      return [];
    }

    return data || [];
  }
}

// =====================================================
// WEBHOOK SERVICE
// =====================================================

export class WebhookService {
  static async logWebhook(logData: WebhookLogInsert): Promise<WebhookLog | null> {
    const { data, error } = await supabaseAdmin
      .from('webhook_logs')
      .insert([logData])
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar log do webhook:', error);
      return null;
    }

    return data;
  }

  static async updateLogStatus(id: string, status: string, errorMessage?: string): Promise<WebhookLog | null> {
    const updateData: WebhookLogUpdate = {
      status,
      processed_at: new Date().toISOString()
    };

    if (errorMessage) {
      updateData.error_message = errorMessage;
    }

    const { data, error } = await supabaseAdmin
      .from('webhook_logs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar log do webhook:', error);
      return null;
    }

    return data;
  }

  static async getRecentLogs(limit: number = 10): Promise<WebhookLog[]> {
    const { data, error } = await supabaseAdmin
      .from('webhook_logs')
      .select('*')
      .order('processed_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar logs recentes:', error);
      return [];
    }

    return data || [];
  }
}

// =====================================================
// APP SETTINGS SERVICE
// =====================================================

export class AppSettingsService {
  static async get(key: string): Promise<AppSetting | null> {
    const { data, error } = await supabaseAdmin
      .from('app_settings')
      .select('*')
      .eq('key', key)
      .single();

    if (error) {
      console.error('Erro ao buscar configuração:', error);
      return null;
    }

    return data;
  }

  static async set(settingData: AppSettingInsert): Promise<AppSetting | null> {
    const { data, error } = await supabaseAdmin
      .from('app_settings')
      .upsert([settingData])
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar configuração:', error);
      return null;
    }

    return data;
  }

  static async getAll(): Promise<AppSetting[]> {
    const { data, error } = await supabaseAdmin
      .from('app_settings')
      .select('*')
      .order('key', { ascending: true });

    if (error) {
      console.error('Erro ao buscar configurações:', error);
      return [];
    }

    return data || [];
  }
}

// =====================================================
// ACTIVITY LOG SERVICE
// =====================================================

export class ActivityLogService {
  static async log(activityData: ActivityLogInsert): Promise<ActivityLog | null> {
    const { data, error } = await supabaseAdmin
      .from('activity_logs')
      .insert([activityData])
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar log de atividade:', error);
      return null;
    }

    return data;
  }

  static async getUserActivities(userId: string, limit: number = 50): Promise<ActivityLog[]> {
    const { data, error } = await supabaseAdmin
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar atividades do usuário:', error);
      return [];
    }

    return data || [];
  }

  static async getRecentActivities(limit: number = 100): Promise<ActivityLog[]> {
    const { data, error } = await supabaseAdmin
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar atividades recentes:', error);
      return [];
    }

    return data || [];
  }
}

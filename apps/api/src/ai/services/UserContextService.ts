import { UserService } from '../../services/UserService';
import { AgendamentoService } from '../../agendamentos';
import { DivorceService } from '../../divorce';
import { supabaseAdmin as supabase } from '../../lib/supabase';
import { CacheService } from './CacheService';

export interface UserContext {
  userProfile: any;
  activeAppointments: any[];
  divorceCases: any[];
  chatHistory: any[];
  preferences: any;
}

export class UserContextService {
  static async getUserContext(userId: string): Promise<UserContext | null> {
    try {
      console.log('🔍 [CONTEXT] Iniciando busca de contexto para usuário:', userId);

      // Verificar cache primeiro
      const cachedContext = await CacheService.getCachedUserContext(userId);
      if (cachedContext) {
        console.log('✅ [CONTEXT] Contexto obtido do cache para usuário:', userId);
        return cachedContext;
      }

      console.log('🔍 [CONTEXT] Buscando contexto para usuário:', userId);

      // Buscar dados básicos do usuário
      const userProfile = await UserService.getUserById(userId);
      console.log('👤 [CONTEXT] Perfil do usuário obtido:', {
        userId,
        hasProfile: !!userProfile,
        name: userProfile?.name,
        email: userProfile?.email
      });

      // Buscar agendamentos ativos (vou buscar múltiplos)
      const appointmentsResult = await this.getUserAppointments(userId);
      const activeAppointments = appointmentsResult.success ? appointmentsResult.appointments || [] : [];
      console.log('📅 [CONTEXT] Agendamentos processados:', {
        userId,
        appointmentsCount: activeAppointments.length,
        success: appointmentsResult.success,
        appointmentsDetails: activeAppointments.map(apt => ({
          id: apt.id,
          status: apt.status,
          created_at: apt.created_at
        }))
      });

      // Buscar casos de divórcio
      const divorceResult = await DivorceService.listarCasosUsuario(userId);
      const divorceCases = divorceResult.success ? divorceResult.cases || [] : [];
      console.log('⚖️ [CONTEXT] Casos de divórcio obtidos:', {
        userId,
        casesCount: divorceCases.length,
        success: divorceResult.success
      });

      // Buscar histórico de conversas
      const chatHistory = await this.getUserChatHistory(userId);

      const context = {
        userProfile,
        activeAppointments,
        divorceCases,
        chatHistory,
        preferences: await this.getUserPreferences(userId)
      };

      console.log('📋 [CONTEXT] Contexto completo criado:', {
        userId,
        hasProfile: !!userProfile,
        profileName: userProfile?.name,
        appointmentsCount: activeAppointments.length,
        casesCount: divorceCases.length,
        chatHistoryCount: chatHistory.length
      });

      // Salvar no cache
      await CacheService.setCachedUserContext(userId, context);

      console.log('✅ [CONTEXT] Contexto obtido e cacheado:', {
        hasProfile: !!userProfile,
        appointmentsCount: context.activeAppointments.length,
        casesCount: context.divorceCases.length,
        conversationsCount: context.chatHistory.length
      });

      return context;
    } catch (error) {
      console.error('❌ [CONTEXT] Erro ao buscar contexto:', error);
      return null;
    }
  }

  private static async getUserAppointments(userId: string) {
    try {
      console.log('🔍 [CONTEXT] Buscando agendamentos para userId:', userId);

      const { data, error } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('user_id', userId)
        .neq('status', 'Cancelado')
        .order('created_at', { ascending: false });

      console.log('📊 [CONTEXT] Resultado da query agendamentos:', {
        hasData: !!data,
        dataLength: data?.length || 0,
        error: error?.message,
        firstItem: data?.[0] ? {
          id: data[0].id,
          status: data[0].status,
          user_id: data[0].user_id
        } : null
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, appointments: data };
    } catch (error) {
      console.error('❌ [CONTEXT] Erro ao buscar agendamentos:', error);
      return { success: false, error: 'Erro interno' };
    }
  }

  private static async getUserChatHistory(userId: string) {
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('id, title, created_at, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('❌ [CONTEXT] Erro ao buscar histórico:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ [CONTEXT] Erro inesperado ao buscar histórico:', error);
      return [];
    }
  }

  static async getUserPreferences(userId: string) {
    // Implementar busca de preferências do usuário
    return {
      language: 'pt-BR',
      expertise_level: 'intermediate',
      focus_areas: ['divorce', 'custody', 'property']
    };
  }
}

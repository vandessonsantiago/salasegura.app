import { supabaseAdmin as supabase } from '../../lib/supabase';
import {
  ChecklistTemplateItem,
  ChecklistSessionData,
  ChecklistItemData,
  ChecklistSessionInsert,
  ChecklistItemInsert,
  ChecklistSessionUpdate,
  ChecklistItemUpdate,
  ChecklistProgressStats,
  ChecklistApiResponse,
  ChecklistSessionResponse,
  ChecklistListResponse,
  ChecklistFilters
} from '../types/checklistDivorce.types';
import { CHECKLIST_TEMPLATE, CURRENT_TEMPLATE_VERSION } from '../templates/checklistTemplate';

export class ChecklistService {
  static async listSessions(userId: string) {
    const { data, error } = await supabase
      .from('checklist_sessions')
      .select(`
        id,
        user_id,
        title,
        progress,
        total_items,
        template_version,
        completed_at,
        created_at,
        updated_at
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  }

  static async getSessionWithItems(userId: string, sessionId: string) {
    // Primeiro buscar a sessão
    let { data: session, error: sessionError } = await supabase
      .from('checklist_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (sessionError) throw new Error(sessionError.message);
    if (!session) return null;

    // Depois buscar os itens relacionados
    let { data: items, error: itemsError } = await supabase
      .from('checklist_items')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (itemsError) throw new Error(itemsError.message);

    // Backfill / upgrade se sessão está vazia ou usando template antigo
    const needsUpgrade = session.template_version === undefined || session.template_version < CURRENT_TEMPLATE_VERSION;
    console.log('[ChecklistService] Verificando upgrade:', {
      sessionId: session.id,
      itemsCount: (items || []).length,
      templateVersion: session.template_version,
      currentVersion: CURRENT_TEMPLATE_VERSION,
      needsUpgrade
    });

    if ((items || []).length === 0 || needsUpgrade) {
      console.log('[ChecklistService] Fazendo upgrade/backfill para sessão', session.id);
      const existingItemIds = (items || []).map((item: any) => item.item_id);
      const itemsToInsert = CHECKLIST_TEMPLATE
        .filter(i => !existingItemIds.includes(i.item_id))
        .map(i => ({
          session_id: session.id,
          item_id: i.item_id,
          category: i.category,
          text: i.text,
          title: i.title,
        }));

      console.log('[ChecklistService] Inserindo', itemsToInsert.length, 'itens');

      if (itemsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('checklist_items')
          .insert(itemsToInsert);

        if (insertError) {
          console.error('[ChecklistService] Erro ao inserir itens:', insertError);
          throw new Error(insertError.message);
        }
      }

      const { error: updateError } = await supabase
        .from('checklist_sessions')
        .update({
          total_items: CHECKLIST_TEMPLATE.length,
          template_version: CURRENT_TEMPLATE_VERSION,
        })
        .eq('id', session.id);

      if (updateError) {
        console.error('[ChecklistService] Erro ao atualizar sessão:', updateError);
        throw new Error(updateError.message);
      }

      // Recarregar os itens após o upgrade
      const { data: updatedItems, error: reloadError } = await supabase
        .from('checklist_items')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (reloadError) {
        console.error('[ChecklistService] Erro ao recarregar itens:', reloadError);
        throw new Error(reloadError.message);
      }

      console.log('[ChecklistService] Upgrade concluído, retornando', (updatedItems || []).length, 'itens');
      return { ...session, items: updatedItems || [] };
    }

    return { ...session, items: items || [] };
  }

  static async createSession(userId: string, title?: string) {
    console.log('[ChecklistService] Criando nova sessão para usuário', userId);
    const { data: session, error: sessionError } = await supabase
      .from('checklist_sessions')
      .insert({
        user_id: userId,
        title: title || 'Checklist "Você está pronto(a) para o cartório?"',
        total_items: CHECKLIST_TEMPLATE.length,
        template_version: CURRENT_TEMPLATE_VERSION,
      })
      .select()
      .single();

    if (sessionError) {
      console.error('[ChecklistService] Erro ao criar sessão:', sessionError);
      throw new Error(sessionError.message);
    }

    console.log('[ChecklistService] Sessão criada:', session.id, 'inserindo', CHECKLIST_TEMPLATE.length, 'itens');

    const { error: insertError } = await supabase
      .from('checklist_items')
      .insert(
        CHECKLIST_TEMPLATE.map(i => ({
          session_id: session.id,
          item_id: i.item_id,
          category: i.category,
          text: i.text,
          title: i.title,
        }))
      );

    if (insertError) {
      console.error('[ChecklistService] Erro ao inserir itens na criação:', insertError);
      throw new Error(insertError.message);
    }

    console.log('[ChecklistService] Itens inseridos com sucesso, carregando sessão completa');
    return this.getSessionWithItems(userId, session.id);
  }

  static async updateItem(userId: string, sessionId: string, itemId: string, checked: boolean) {
    const { data: item, error: itemError } = await supabase
      .from('checklist_items')
      .select()
      .eq('session_id', sessionId)
      .eq('item_id', itemId)
      .single();

    if (itemError) throw new Error(itemError.message);
    if (!item) throw new Error("Item not found");

    await supabase
      .from('checklist_items')
      .update({ completed: checked })
      .eq('id', item.id);

    // Recalcular progresso
    const { data: allItems } = await supabase
      .from('checklist_items')
      .select('completed')
      .eq('session_id', sessionId);

    const checkedCount = (allItems || []).filter((i: any) => i.completed).length;

    // Buscar a sessão para obter total_items
    const { data: sessionData } = await supabase
      .from('checklist_sessions')
      .select('total_items')
      .eq('id', sessionId)
      .single();

    await supabase
      .from('checklist_sessions')
      .update({
        progress: checkedCount,
        completed_at: checkedCount === (sessionData?.total_items || 0) ? new Date() : null,
      })
      .eq('id', sessionId);

    return this.getSessionWithItems(userId, sessionId);
  }

  static async deleteSession(userId: string, sessionId: string) {
    const { error: sessionError } = await supabase
      .from('checklist_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', userId);

    if (sessionError) throw new Error(sessionError.message);

    return true;
  }
}

// Função utilitária opcional para backfill manual (pode ser chamada em um script ou rota admin futura)
export async function backfillAllChecklistSessionsForUser(userId: string) {
  const { data: sessions, error } = await supabase
    .from('checklist_sessions')
    .select('*')
    .eq('user_id', userId);

  if (error) throw new Error(error.message);

  for (const s of sessions) {
    // Verificar se a sessão tem itens
    const { data: items } = await supabase
      .from('checklist_items')
      .select('id')
      .eq('session_id', s.id);

    if ((items || []).length === 0) {
      await supabase
        .from('checklist_items')
        .insert(
          CHECKLIST_TEMPLATE.map(i => ({
            session_id: s.id,
            item_id: i.item_id,
            category: i.category,
            text: i.text,
            title: i.title,
          }))
        );

      await supabase
        .from('checklist_sessions')
        .update({
          total_items: CHECKLIST_TEMPLATE.length,
        })
        .eq('id', s.id);
    }
  }
  return true;
}

export default ChecklistService;
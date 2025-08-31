import { supabaseAdmin as supabase } from '../lib/supabase';

export interface ChecklistTemplateItem { item_id: string; category: string; text: string; title: string; }
const CURRENT_TEMPLATE_VERSION = 2;
// Template ampliado v2 (50 itens)
const CHECKLIST_TEMPLATE: ChecklistTemplateItem[] = [
  { item_id: '1.1', category: 'elegibilidade_procedimento', text: 'Divórcio é consensual e integral (partilha, alimentos e nome definidos).', title: 'Divórcio é consensual e integral (partilha, alimentos e nome definidos).' },
  { item_id: '1.2', category: 'elegibilidade_procedimento', text: 'Não há filhos menores ou incapazes e não há gestação em curso.', title: 'Não há filhos menores ou incapazes e não há gestação em curso.' },
  { item_id: '1.3', category: 'elegibilidade_procedimento', text: 'Ambas as partes são plenamente capazes e manifestam vontade livre.', title: 'Ambas as partes são plenamente capazes e manifestam vontade livre.' },
  { item_id: '1.4', category: 'elegibilidade_procedimento', text: 'Presença de advogado(a) (um para ambos ou um para cada) com OAB ativa.', title: 'Presença de advogado(a) (um para ambos ou um para cada) com OAB ativa.' },
  { item_id: '1.5', category: 'elegibilidade_procedimento', text: 'Definida a via: extrajudicial (cartório) ou judicial (se houver motivo).', title: 'Definida a via: extrajudicial (cartório) ou judicial (se houver motivo).' },
  { item_id: '1.6', category: 'elegibilidade_procedimento', text: 'Data de corte patrimonial (separação de fato) definida.', title: 'Data de corte patrimonial (separação de fato) definida.' },
  { item_id: '1.7', category: 'elegibilidade_procedimento', text: 'Regime de bens identificado e natureza de cada bem analisada.', title: 'Regime de bens identificado e natureza de cada bem analisada.' },
  { item_id: '1.8', category: 'elegibilidade_procedimento', text: 'Impedimentos contratuais/legais verificados (alienações, financiamentos, restrições).', title: 'Impedimentos contratuais/legais verificados (alienações, financiamentos, restrições).' },
  { item_id: '2.1', category: 'documentos_pessoais', text: 'Certidão de casamento atualizada (~90 dias).', title: 'Certidão de casamento atualizada (~90 dias).' },
  { item_id: '2.2', category: 'documentos_pessoais', text: 'Pacto antenupcial registrado (se houver).', title: 'Pacto antenupcial registrado (se houver).' },
  { item_id: '2.3', category: 'documentos_pessoais', text: 'Documentos pessoais válidos (RG, CPF, etc.).', title: 'Documentos pessoais válidos (RG, CPF, etc.).' },
  { item_id: '2.4', category: 'documentos_pessoais', text: 'Comprovante de endereço de cada parte.', title: 'Comprovante de endereço de cada parte.' },
  { item_id: '2.5', category: 'documentos_pessoais', text: 'Procuração pública específica (se representação).', title: 'Procuração pública específica (se representação).' },
  { item_id: '2.6', category: 'documentos_pessoais', text: 'Declaração de inexistência de gravidez (se exigido).', title: 'Declaração de inexistência de gravidez (se exigido).' },
  { item_id: '2.7', category: 'documentos_pessoais', text: 'Contatos (e-mail/telefone) confirmados.', title: 'Contatos (e-mail/telefone) confirmados.' },
  { item_id: '3.1', category: 'filhos_maiores', text: 'Identificação de filhos maiores (se houver).', title: 'Identificação de filhos maiores (se houver).' },
  { item_id: '3.2', category: 'filhos_maiores', text: 'Benefícios voluntários (plano de saúde, apoio financeiro) definidos.', title: 'Benefícios voluntários (plano de saúde, apoio financeiro) definidos.' },
  { item_id: '3.3', category: 'filhos_maiores', text: 'Ajustes no IRPF (dependência/deduções) considerados.', title: 'Ajustes no IRPF (dependência/deduções) considerados.' },
  { item_id: '3.4', category: 'filhos_maiores', text: 'Acordos interfamiliares facultativos registrados.', title: 'Acordos interfamiliares facultativos registrados.' },
  { item_id: '4.1', category: 'patrimonio_financas', text: 'Lista detalhada de bens (imóveis, veículos, quotas, cripto etc.).', title: 'Lista detalhada de bens (imóveis, veículos, quotas, cripto etc.).' },
  { item_id: '4.2', category: 'patrimonio_financas', text: 'Imóveis: matrículas, ônus, IPTU, taxas, condomínio.', title: 'Imóveis: matrículas, ônus, IPTU, taxas, condomínio.' },
  { item_id: '4.3', category: 'patrimonio_financas', text: 'Veículos: CRLV, Renavam, IPVA, multas, seguro.', title: 'Veículos: CRLV, Renavam, IPVA, multas, seguro.' },
  { item_id: '4.4', category: 'patrimonio_financas', text: 'Ativos financeiros: extratos (contas, investimentos, previdência).', title: 'Ativos financeiros: extratos (contas, investimentos, previdência).' },
  { item_id: '4.5', category: 'patrimonio_financas', text: 'Créditos a receber (FGTS, PIS, PLR, ações, restituição, haveres).', title: 'Créditos a receber (FGTS, PIS, PLR, ações, restituição, haveres).' },
  { item_id: '4.6', category: 'patrimonio_financas', text: 'Bens/direitos digitais (domínios, licenças, plataformas, carteiras).', title: 'Bens/direitos digitais (domínios, licenças, plataformas, carteiras).' },
  { item_id: '4.7', category: 'patrimonio_financas', text: 'Dívidas/obrigações (cartões, empréstimos, financiamentos, consórcios).', title: 'Dívidas/obrigações (cartões, empréstimos, financiamentos, consórcios).' },
  { item_id: '4.8', category: 'patrimonio_financas', text: 'Bens particulares discriminados (anteriores, heranças, doações).', title: 'Bens particulares discriminados (anteriores, heranças, doações).' },
  { item_id: '4.9', category: 'patrimonio_financas', text: 'Prazos/formas de transferência de bens/documentos definidos.', title: 'Prazos/formas de transferência de bens/documentos definidos.' },
  { item_id: '4.10', category: 'patrimonio_financas', text: 'Cláusula de sobrepartilha prevista.', title: 'Cláusula de sobrepartilha prevista.' },
  { item_id: '5.1', category: 'tributacao_custos', text: 'Incidência de ITBI/ITCMD avaliada (partilha desigual/torna).', title: 'Incidência de ITBI/ITCMD avaliada (partilha desigual/torna).' },
  { item_id: '5.2', category: 'tributacao_custos', text: 'Ganho de capital (torna/permuta) avaliado com contador(a).', title: 'Ganho de capital (torna/permuta) avaliado com contador(a).' },
  { item_id: '5.3', category: 'tributacao_custos', text: 'Emolumentos e taxas de registro mapeados.', title: 'Emolumentos e taxas de registro mapeados.' },
  { item_id: '5.4', category: 'tributacao_custos', text: 'Honorários advocatícios/mediação definidos.', title: 'Honorários advocatícios/mediação definidos.' },
  { item_id: '5.5', category: 'tributacao_custos', text: 'Impactos no IRPF (bens, rendimentos, pensão) considerados.', title: 'Impactos no IRPF (bens, rendimentos, pensão) considerados.' },
  { item_id: '6.1', category: 'alimentos_obrigacoes', text: 'Pensão: existência, valor ou renúncia.', title: 'Pensão: existência, valor ou renúncia.' },
  { item_id: '6.2', category: 'alimentos_obrigacoes', text: 'Alimentos compensatórios temporários (se aplicável).', title: 'Alimentos compensatórios temporários (se aplicável).' },
  { item_id: '6.3', category: 'alimentos_obrigacoes', text: 'Regras de pagamento: índice, datas, conta/PIX, recibo.', title: 'Regras de pagamento: índice, datas, conta/PIX, recibo.' },
  { item_id: '6.4', category: 'alimentos_obrigacoes', text: 'Cláusula penal por atraso e meios de execução.', title: 'Cláusula penal por atraso e meios de execução.' },
  { item_id: '6.5', category: 'alimentos_obrigacoes', text: 'Uso de imóvel comum até transferência ajustado.', title: 'Uso de imóvel comum até transferência ajustado.' },
  { item_id: '7.1', category: 'nome_comunicacoes', text: 'Decisão sobre manutenção ou retomada do nome.', title: 'Decisão sobre manutenção ou retomada do nome.' },
  { item_id: '7.2', category: 'nome_comunicacoes', text: 'Averbação do divórcio e atualização de documentos.', title: 'Averbação do divórcio e atualização de documentos.' },
  { item_id: '7.3', category: 'nome_comunicacoes', text: 'Atualização cadastral em órgãos e instituições.', title: 'Atualização cadastral em órgãos e instituições.' },
  { item_id: '7.4', category: 'nome_comunicacoes', text: 'Atualização de beneficiários (seguros, previdência, etc.).', title: 'Atualização de beneficiários (seguros, previdência, etc.).' },
  { item_id: '8.1', category: 'execucao_partilha', text: 'Anuência do agente financeiro para imóveis financiados (se preciso).', title: 'Anuência do agente financeiro para imóveis financiados (se preciso).' },
  { item_id: '8.2', category: 'execucao_partilha', text: 'Registro da partilha nos cartórios competentes.', title: 'Registro da partilha nos cartórios competentes.' },
  { item_id: '8.3', category: 'execucao_partilha', text: 'Transferência de titularidade (utilidades, IPTU, condomínio) e chaves.', title: 'Transferência de titularidade (utilidades, IPTU, condomínio) e chaves.' },
  { item_id: '8.4', category: 'execucao_partilha', text: 'Veículos: transferência, comunicação e seguro.', title: 'Veículos: transferência, comunicação e seguro.' },
  { item_id: '9.1', category: 'minuta_cartorio', text: 'Cartório de Notas escolhido e exigências verificadas.', title: 'Cartório de Notas escolhido e exigências verificadas.' },
  { item_id: '9.2', category: 'minuta_cartorio', text: 'Assinatura presencial ou e-Notariado definida.', title: 'Assinatura presencial ou e-Notariado definida.' },
  { item_id: '9.3', category: 'minuta_cartorio', text: 'Procuração com poderes expressos (se representação).', title: 'Procuração com poderes expressos (se representação).' },
  { item_id: '10.1', category: 'clausulas_finais', text: 'Declaração de inexistência de filhos menores/incapazes e gestação.', title: 'Declaração de inexistência de filhos menores/incapazes e gestação.' },
  { item_id: '10.2', category: 'clausulas_finais', text: 'Quitação recíproca (bens/dívidas), ressalvada sobrepartilha.', title: 'Quitação recíproca (bens/dívidas), ressalvada sobrepartilha.' },
  { item_id: '10.3', category: 'clausulas_finais', text: 'Eleição de foro para execução.', title: 'Eleição de foro para execução.' },
  { item_id: '10.4', category: 'clausulas_finais', text: 'Cláusula de confidencialidade (se desejado).', title: 'Cláusula de confidencialidade (se desejado).' },
  { item_id: '10.5', category: 'clausulas_finais', text: 'Mediação prévia para conflitos futuros (facultativo).', title: 'Mediação prévia para conflitos futuros (facultativo).' },
  { item_id: '10.6', category: 'clausulas_finais', text: 'Assistência de advogado(a) e ciência dos efeitos registrada.', title: 'Assistência de advogado(a) e ciência dos efeitos registrada.' },
  { item_id: '10.7', category: 'clausulas_finais', text: 'Vigência imediata após lavratura.', title: 'Vigência imediata após lavratura.' },
  { item_id: '10.8', category: 'clausulas_finais', text: 'Guarda segura de cópias e comprovantes.', title: 'Guarda segura de cópias e comprovantes.' },
  { item_id: '10.9', category: 'clausulas_finais', text: 'Encerramento de contas conjuntas, cartões e acessos.', title: 'Encerramento de contas conjuntas, cartões e acessos.' },
  { item_id: '10.10', category: 'clausulas_finais', text: 'Itens facultativos (animais de estimação, bens móveis).', title: 'Itens facultativos (animais de estimação, bens móveis).' },
];

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
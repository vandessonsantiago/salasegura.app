import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

export interface ChecklistTemplateItem { item_id: string; category: string; text: string; }
const CURRENT_TEMPLATE_VERSION = 2;
// Template ampliado v2 (50 itens)
const CHECKLIST_TEMPLATE: ChecklistTemplateItem[] = [
  { item_id: '1.1', category: 'elegibilidade_procedimento', text: 'Divórcio é consensual e integral (partilha, alimentos e nome definidos).' },
  { item_id: '1.2', category: 'elegibilidade_procedimento', text: 'Não há filhos menores ou incapazes e não há gestação em curso.' },
  { item_id: '1.3', category: 'elegibilidade_procedimento', text: 'Ambas as partes são plenamente capazes e manifestam vontade livre.' },
  { item_id: '1.4', category: 'elegibilidade_procedimento', text: 'Presença de advogado(a) (um para ambos ou um para cada) com OAB ativa.' },
  { item_id: '1.5', category: 'elegibilidade_procedimento', text: 'Definida a via: extrajudicial (cartório) ou judicial (se houver motivo).' },
  { item_id: '1.6', category: 'elegibilidade_procedimento', text: 'Data de corte patrimonial (separação de fato) definida.' },
  { item_id: '1.7', category: 'elegibilidade_procedimento', text: 'Regime de bens identificado e natureza de cada bem analisada.' },
  { item_id: '1.8', category: 'elegibilidade_procedimento', text: 'Impedimentos contratuais/legais verificados (alienações, financiamentos, restrições).' },
  { item_id: '2.1', category: 'documentos_pessoais', text: 'Certidão de casamento atualizada (~90 dias).' },
  { item_id: '2.2', category: 'documentos_pessoais', text: 'Pacto antenupcial registrado (se houver).' },
  { item_id: '2.3', category: 'documentos_pessoais', text: 'Documentos pessoais válidos (RG, CPF, etc.).' },
  { item_id: '2.4', category: 'documentos_pessoais', text: 'Comprovante de endereço de cada parte.' },
  { item_id: '2.5', category: 'documentos_pessoais', text: 'Procuração pública específica (se representação).' },
  { item_id: '2.6', category: 'documentos_pessoais', text: 'Declaração de inexistência de gravidez (se exigido).' },
  { item_id: '2.7', category: 'documentos_pessoais', text: 'Contatos (e-mail/telefone) confirmados.' },
  { item_id: '3.1', category: 'filhos_maiores', text: 'Identificação de filhos maiores (se houver).' },
  { item_id: '3.2', category: 'filhos_maiores', text: 'Benefícios voluntários (plano de saúde, apoio financeiro) definidos.' },
  { item_id: '3.3', category: 'filhos_maiores', text: 'Ajustes no IRPF (dependência/deduções) considerados.' },
  { item_id: '3.4', category: 'filhos_maiores', text: 'Acordos interfamiliares facultativos registrados.' },
  { item_id: '4.1', category: 'patrimonio_financas', text: 'Lista detalhada de bens (imóveis, veículos, quotas, cripto etc.).' },
  { item_id: '4.2', category: 'patrimonio_financas', text: 'Imóveis: matrículas, ônus, IPTU, taxas, condomínio.' },
  { item_id: '4.3', category: 'patrimonio_financas', text: 'Veículos: CRLV, Renavam, IPVA, multas, seguro.' },
  { item_id: '4.4', category: 'patrimonio_financas', text: 'Ativos financeiros: extratos (contas, investimentos, previdência).' },
  { item_id: '4.5', category: 'patrimonio_financas', text: 'Créditos a receber (FGTS, PIS, PLR, ações, restituição, haveres).' },
  { item_id: '4.6', category: 'patrimonio_financas', text: 'Bens/direitos digitais (domínios, licenças, plataformas, carteiras).' },
  { item_id: '4.7', category: 'patrimonio_financas', text: 'Dívidas/obrigações (cartões, empréstimos, financiamentos, consórcios).' },
  { item_id: '4.8', category: 'patrimonio_financas', text: 'Bens particulares discriminados (anteriores, heranças, doações).' },
  { item_id: '4.9', category: 'patrimonio_financas', text: 'Prazos/formas de transferência de bens/documentos definidos.' },
  { item_id: '4.10', category: 'patrimonio_financas', text: 'Cláusula de sobrepartilha prevista.' },
  { item_id: '5.1', category: 'tributacao_custos', text: 'Incidência de ITBI/ITCMD avaliada (partilha desigual/torna).' },
  { item_id: '5.2', category: 'tributacao_custos', text: 'Ganho de capital (torna/permuta) avaliado com contador(a).' },
  { item_id: '5.3', category: 'tributacao_custos', text: 'Emolumentos e taxas de registro mapeados.' },
  { item_id: '5.4', category: 'tributacao_custos', text: 'Honorários advocatícios/mediação definidos.' },
  { item_id: '5.5', category: 'tributacao_custos', text: 'Impactos no IRPF (bens, rendimentos, pensão) considerados.' },
  { item_id: '6.1', category: 'alimentos_obrigacoes', text: 'Pensão: existência, valor ou renúncia.' },
  { item_id: '6.2', category: 'alimentos_obrigacoes', text: 'Alimentos compensatórios temporários (se aplicável).' },
  { item_id: '6.3', category: 'alimentos_obrigacoes', text: 'Regras de pagamento: índice, datas, conta/PIX, recibo.' },
  { item_id: '6.4', category: 'alimentos_obrigacoes', text: 'Cláusula penal por atraso e meios de execução.' },
  { item_id: '6.5', category: 'alimentos_obrigacoes', text: 'Uso de imóvel comum até transferência ajustado.' },
  { item_id: '7.1', category: 'nome_comunicacoes', text: 'Decisão sobre manutenção ou retomada do nome.' },
  { item_id: '7.2', category: 'nome_comunicacoes', text: 'Averbação do divórcio e atualização de documentos.' },
  { item_id: '7.3', category: 'nome_comunicacoes', text: 'Atualização cadastral em órgãos e instituições.' },
  { item_id: '7.4', category: 'nome_comunicacoes', text: 'Atualização de beneficiários (seguros, previdência, etc.).' },
  { item_id: '8.1', category: 'execucao_partilha', text: 'Anuência do agente financeiro para imóveis financiados (se preciso).' },
  { item_id: '8.2', category: 'execucao_partilha', text: 'Registro da partilha nos cartórios competentes.' },
  { item_id: '8.3', category: 'execucao_partilha', text: 'Transferência de titularidade (utilidades, IPTU, condomínio) e chaves.' },
  { item_id: '8.4', category: 'execucao_partilha', text: 'Veículos: transferência, comunicação e seguro.' },
  { item_id: '9.1', category: 'minuta_cartorio', text: 'Cartório de Notas escolhido e exigências verificadas.' },
  { item_id: '9.2', category: 'minuta_cartorio', text: 'Assinatura presencial ou e-Notariado definida.' },
  { item_id: '9.3', category: 'minuta_cartorio', text: 'Procuração com poderes expressos (se representação).' },
  { item_id: '10.1', category: 'clausulas_finais', text: 'Declaração de inexistência de filhos menores/incapazes e gestação.' },
  { item_id: '10.2', category: 'clausulas_finais', text: 'Quitação recíproca (bens/dívidas), ressalvada sobrepartilha.' },
  { item_id: '10.3', category: 'clausulas_finais', text: 'Eleição de foro para execução.' },
  { item_id: '10.4', category: 'clausulas_finais', text: 'Cláusula de confidencialidade (se desejado).' },
  { item_id: '10.5', category: 'clausulas_finais', text: 'Mediação prévia para conflitos futuros (facultativo).' },
  { item_id: '10.6', category: 'clausulas_finais', text: 'Assistência de advogado(a) e ciência dos efeitos registrada.' },
  { item_id: '10.7', category: 'clausulas_finais', text: 'Vigência imediata após lavratura.' },
  { item_id: '10.8', category: 'clausulas_finais', text: 'Guarda segura de cópias e comprovantes.' },
  { item_id: '10.9', category: 'clausulas_finais', text: 'Encerramento de contas conjuntas, cartões e acessos.' },
  { item_id: '10.10', category: 'clausulas_finais', text: 'Itens facultativos (animais de estimação, bens móveis).' },
];

export class ChecklistService {
  static async listSessions(userId: string) {
    return prisma.checklistSession.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        user_id: true,
        title: true,
        progress: true,
        total_items: true,
        template_version: true,
        completed_at: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  static async getSessionWithItems(userId: string, sessionId: string) {
    let session = await prisma.checklistSession.findFirst({
      where: { id: sessionId, user_id: userId },
      include: { items: true },
    });
    if (!session) return null;

    // Backfill / upgrade se sessão está vazia ou usando template antigo
    const needsUpgrade = session.template_version === undefined || session.template_version < CURRENT_TEMPLATE_VERSION;
    if (session.items.length === 0 || needsUpgrade) {
      await prisma.$transaction(async (tx) => {
        // Rechecar dentro da transação para evitar corrida
        const again = await tx.checklistSession.findUnique({
          where: { id: sessionId },
          include: { items: true },
        });
        if (again) {
          const existingIds = new Set(again.items.map(i => i.item_id));
          const missing = CHECKLIST_TEMPLATE.filter(i => !existingIds.has(i.item_id));
          if (missing.length > 0) {
            await tx.checklistItem.createMany({
              data: missing.map(i => ({
                session_id: again.id,
                item_id: i.item_id,
                category: i.category,
                text: i.text,
              })),
            });
          }
          await tx.checklistSession.update({
            where: { id: again.id },
            data: { total_items: CHECKLIST_TEMPLATE.length, template_version: CURRENT_TEMPLATE_VERSION },
          });
        }
      });
      // Recarregar com itens agora presentes
      session = await prisma.checklistSession.findUnique({
        where: { id: sessionId },
        include: { items: true },
      });
    }
    return session;
  }

  static async createSession(userId: string, title?: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.checklistSession.findFirst({
        where: { user_id: userId, title: { contains: "Checklist" } },
      });
      // Não impedir múltiplas, mas normalmente só haverá uma. Podemos simplesmente criar sempre.
      const session = await tx.checklistSession.create({
        data: {
          user_id: userId,
          title: title || 'Checklist "Você está pronto(a) para o cartório?"',
          total_items: CHECKLIST_TEMPLATE.length,
          template_version: CURRENT_TEMPLATE_VERSION,
        },
      });

      await tx.checklistItem.createMany({
        data: CHECKLIST_TEMPLATE.map((i) => ({
          session_id: session.id,
          item_id: i.item_id,
          category: i.category,
          text: i.text,
        })),
      });

      const full = await tx.checklistSession.findUnique({
        where: { id: session.id },
        include: { items: true },
      });
      return full;
    });
  }

  static async updateItem(userId: string, sessionId: string, itemId: string, checked: boolean) {
    return prisma.$transaction(async (tx) => {
      // Validar sessão pertence ao usuário
      const session = await tx.checklistSession.findFirst({
        where: { id: sessionId, user_id: userId },
      });
      if (!session) throw new Error("Session not found");

      const item = await tx.checklistItem.findFirst({
        where: { session_id: sessionId, item_id: itemId },
      });
      if (!item) throw new Error("Item not found");

      await tx.checklistItem.update({
        where: { id: item.id },
        data: { checked },
      });

      // Recalcular progresso
      const checkedCount = await tx.checklistItem.count({
        where: { session_id: sessionId, checked: true },
      });

      await tx.checklistSession.update({
        where: { id: sessionId },
        data: {
          progress: checkedCount,
          completed_at: checkedCount === session.total_items ? new Date() : null,
        },
      });

      const updated = await tx.checklistSession.findUnique({
        where: { id: sessionId },
        include: { items: true },
      });
      return updated;
    });
  }

  static async deleteSession(userId: string, sessionId: string) {
    return prisma.$transaction(async (tx) => {
      const session = await tx.checklistSession.findFirst({
        where: { id: sessionId, user_id: userId },
      });
      if (!session) throw new Error("Session not found");

      await tx.checklistItem.deleteMany({ where: { session_id: sessionId } });
      await tx.checklistSession.delete({ where: { id: sessionId } });
      return true;
    });
  }
}

// Função utilitária opcional para backfill manual (pode ser chamada em um script ou rota admin futura)
export async function backfillAllChecklistSessionsForUser(userId: string) {
  const sessions = await prisma.checklistSession.findMany({ where: { user_id: userId }, include: { items: true } });
  for (const s of sessions) {
    if (s.items.length === 0) {
      await prisma.$transaction(async (tx) => {
        const again = await tx.checklistSession.findUnique({ where: { id: s.id }, include: { items: true } });
        if (again && again.items.length === 0) {
          await tx.checklistItem.createMany({
            data: CHECKLIST_TEMPLATE.map((i) => ({
              session_id: again.id,
              item_id: i.item_id,
              category: i.category,
              text: i.text,
            })),
          });
          await tx.checklistSession.update({
            where: { id: again.id },
            data: { total_items: CHECKLIST_TEMPLATE.length },
          });
        }
      });
    }
  }
  return true;
}

export default ChecklistService;
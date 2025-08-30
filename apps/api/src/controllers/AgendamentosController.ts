import { Request, Response } from "express";
import { randomUUID } from "crypto";
import { supabaseAdmin as supabase } from "../lib/supabase";

// Tipo para request autenticado
type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    email: string;
  };
};

export class AgendamentosController {
    // Buscar todos os agendamentos do usuário
  static async getUserAgendamentos(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      console.log("🔍 getUserAgendamentos: Iniciando busca de agendamentos");
      const userId = req.user?.id;
      console.log("👤 User ID:", userId);

      if (!userId) {
        console.log("❌ Usuário não autenticado");
        res.status(401).json({
          success: false,
          error: "Usuário não autenticado",
        });
        return;
      }

      console.log("📡 Consultando tabela agendamentos para user:", userId);
      // Primeiro buscar agendamentos
      const { data: agendamentos, error: agendamentosError } = await supabase
        .from("agendamentos")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (agendamentosError) {
        console.error("❌ Erro ao buscar agendamentos:", agendamentosError);
        res.status(500).json({
          success: false,
          error: "Erro interno do servidor",
          details: agendamentosError.message,
        });
        return;
      }

      // Não precisamos buscar payments relacionados pois o payment_id no agendamento
      // já é o ID do Asaas, não um UUID da tabela payments local
      // Os dados de payment_status já estão armazenados diretamente no agendamento

      // Combinar dados - payment_id já contém o ID do Asaas diretamente
      const data = agendamentos?.map(agendamento => ({
        ...agendamento,
        payments: [] // Não precisamos de payments adicionais pois os dados já estão no agendamento
      }));

      console.log("✅ Agendamentos encontrados:", data?.length || 0);

      // Log detalhado de TODOS os agendamentos com seus dados completos
      console.log("🔍 === LOG DETALHADO DE TODOS OS AGENDAMENTOS DO BANCO ===");
      data?.forEach((agendamento, index) => {
        console.log(`📋 Agendamento ${index + 1}:`, {
          id: agendamento.id,
          user_id: agendamento.user_id,
          data: agendamento.data,
          horario: agendamento.horario,
          status: agendamento.status,
          payment_id: agendamento.payment_id,
          payment_status: agendamento.payment_status,
          valor: agendamento.valor,
          descricao: agendamento.descricao,
          cliente_nome: agendamento.cliente_nome,
          cliente_email: agendamento.cliente_email,
          cliente_telefone: agendamento.cliente_telefone,
          qr_code_pix: agendamento.qr_code_pix,
          copy_paste_pix: agendamento.copy_paste_pix,
          pix_expires_at: agendamento.pix_expires_at,
          calendar_event_id: agendamento.calendar_event_id,
          google_meet_link: agendamento.google_meet_link,
          created_at: agendamento.created_at,
          updated_at: agendamento.updated_at,
          // Análises detalhadas do link
          google_meet_link_type: typeof agendamento.google_meet_link,
          google_meet_link_length: agendamento.google_meet_link?.length,
          google_meet_link_is_empty: agendamento.google_meet_link === "",
          google_meet_link_is_null: agendamento.google_meet_link === null,
          google_meet_link_is_undefined: agendamento.google_meet_link === undefined,
          google_meet_link_trimmed: agendamento.google_meet_link?.trim(),
          google_meet_link_trimmed_empty: agendamento.google_meet_link?.trim() === "",
          google_meet_link_trimmed_length: agendamento.google_meet_link?.trim()?.length,
          google_meet_link_is_valid_url: agendamento.google_meet_link?.trim()?.startsWith('http'),
          google_meet_link_contains_meet: agendamento.google_meet_link?.includes('meet.google.com'),
          google_meet_link_has_whitespace: /\s/.test(agendamento.google_meet_link || ''),
          google_meet_link_has_newlines: /\n/.test(agendamento.google_meet_link || ''),
          // Análises do status
          status_is_confirmed: agendamento.status === "CONFIRMED",
          has_calendar_event: !!agendamento.calendar_event_id,
          has_valid_link: agendamento.google_meet_link && agendamento.google_meet_link.trim() !== "" && agendamento.google_meet_link.trim().startsWith('http') && agendamento.google_meet_link.trim().startsWith('http')
        });
      });
      console.log("🔍 === FIM DO LOG DETALHADO ===");

      console.log("🔍 Primeiro agendamento (debug):", data?.[0] ? {
        id: data[0].id,
        google_meet_link: data[0].google_meet_link,
        status: data[0].status,
        hasLink: !!data[0].google_meet_link
      } : "Nenhum agendamento");

      // Transformar dados para o formato esperado pelo frontend
      const transformedData = data?.map(agendamento => {
        const transformed = {
          id: agendamento.id,
          data: agendamento.data,
          horario: agendamento.horario,
          status: agendamento.status,
          paymentId: agendamento.payment_id,
          paymentStatus: agendamento.payment_status,
          valor: agendamento.valor,
          descricao: agendamento.descricao,
          cliente: {
            nome: agendamento.cliente_nome,
            email: agendamento.cliente_email,
            telefone: agendamento.cliente_telefone,
          },
          createdAt: agendamento.created_at,
          qrCodePix: agendamento.qr_code_pix,
          copyPastePix: agendamento.copy_paste_pix,
          pixExpiresAt: agendamento.pix_expires_at,
          calendarEventId: agendamento.calendar_event_id,
          googleMeetLink: (() => {
            // Primeiro tenta usar o google_meet_link direto
            if (agendamento.google_meet_link && agendamento.google_meet_link.trim()) {
              return agendamento.google_meet_link.trim();
            }
            
            // Se estiver vazio, tenta extrair do service_data
            if (agendamento.service_data) {
              try {
                const serviceData = typeof agendamento.service_data === 'string' 
                  ? JSON.parse(agendamento.service_data) 
                  : agendamento.service_data;
                
                if (serviceData?.googleMeetLink && serviceData.googleMeetLink.trim()) {
                  console.log(`🔗 Extraindo link do service_data para agendamento ${agendamento.id}:`, serviceData.googleMeetLink);
                  return serviceData.googleMeetLink.trim();
                }
              } catch (error) {
                console.error(`❌ Erro ao fazer parse do service_data para agendamento ${agendamento.id}:`, error);
              }
            }
            
            return null;
          })(),
          // Incluir dados do pagamento se existir
          payment: agendamento.payments?.[0] || null
        };

        console.log(`🔄 Transformação do agendamento ${agendamento.id}:`, {
          original_google_meet_link: agendamento.google_meet_link,
          transformed_google_meet_link: transformed.googleMeetLink,
          original_status: agendamento.status,
          transformed_status: transformed.status,
          original_calendar_event_id: agendamento.calendar_event_id,
          transformed_calendar_event_id: transformed.calendarEventId
        });

        return transformed;
      }) || [];

      res.json({
        success: true,
        data: transformedData,
      });

      // Log final do que está sendo enviado para o frontend
      console.log("📤 === DADOS ENVIADOS PARA O FRONTEND ===");
      transformedData.forEach((agendamento, index) => {
        console.log(`📤 Agendamento ${index + 1} enviado:`, {
          id: agendamento.id,
          status: agendamento.status,
          googleMeetLink: agendamento.googleMeetLink,
          calendarEventId: agendamento.calendarEventId,
          // Análises finais
          hasValidLink: agendamento.googleMeetLink && agendamento.googleMeetLink.trim() !== "",
          statusIsConfirmed: agendamento.status === "CONFIRMED",
          hasCalendarEvent: !!agendamento.calendarEventId
        });
      });
      console.log("📤 === FIM DOS DADOS ENVIADOS ===");
    } catch (error) {
      console.error("Erro no controller getUserAgendamentos:", error);
      res.status(500).json({
        success: false,
        error: "Erro interno do servidor",
      });
    }
  }

  // Criar novo agendamento
  static async createAgendamento(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: "Usuário não autenticado",
        });
        return;
      }

      // Garantir que haja um id (a tabela exige id NOT NULL sem default)
      const generatedId = (req.body && (req.body.id || req.body.id === 0)) ? req.body.id : randomUUID();

      // Normalizar campos simples (ex: valor)
      const valorNum = req.body?.valor !== undefined ? parseFloat(String(req.body.valor)) : 0;

      const agendamentoData = {
        id: generatedId,
        ...req.body,
        valor: valorNum,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("agendamentos")
        .insert([agendamentoData])
        .select()
        .single();

      if (error) {
        console.error("Erro ao criar agendamento:", error);
        res.status(500).json({
          success: false,
          error: "Erro interno do servidor",
        });
        return;
      }

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error("Erro no controller createAgendamento:", error);
      res.status(500).json({
        success: false,
        error: "Erro interno do servidor",
      });
    }
  }

  // Buscar agendamento específico
  static async getAgendamento(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: "Usuário não autenticado",
        });
        return;
      }

      const { data, error } = await supabase
        .from("agendamentos")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          res.status(404).json({
            success: false,
            error: "Agendamento não encontrado",
          });
          return;
        }

        console.error("Erro ao buscar agendamento:", error);
        res.status(500).json({
          success: false,
          error: "Erro interno do servidor",
        });
        return;
      }

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error("Erro no controller getAgendamento:", error);
      res.status(500).json({
        success: false,
        error: "Erro interno do servidor",
      });
    }
  }

  // Atualizar agendamento
  static async updateAgendamento(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: "Usuário não autenticado",
        });
        return;
      }

      const updateData = {
        ...req.body,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("agendamentos")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          res.status(404).json({
            success: false,
            error: "Agendamento não encontrado",
          });
          return;
        }

        console.error("Erro ao atualizar agendamento:", error);
        res.status(500).json({
          success: false,
          error: "Erro interno do servidor",
        });
        return;
      }

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error("Erro no controller updateAgendamento:", error);
      res.status(500).json({
        success: false,
        error: "Erro interno do servidor",
      });
    }
  }

  // Deletar agendamento
  static async deleteAgendamento(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: "Usuário não autenticado",
        });
        return;
      }

      const { error } = await supabase
        .from("agendamentos")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        console.error("Erro ao deletar agendamento:", error);
        res.status(500).json({
          success: false,
          error: "Erro interno do servidor",
        });
        return;
      }

      res.json({
        success: true,
        message: "Agendamento deletado com sucesso",
      });
    } catch (error) {
      console.error("Erro no controller deleteAgendamento:", error);
      res.status(500).json({
        success: false,
        error: "Erro interno do servidor",
      });
    }
  }
}

export default AgendamentosController;

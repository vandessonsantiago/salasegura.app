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
      const { data, error } = await supabase
        .from("agendamentos")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Erro ao buscar agendamentos:", error);
        res.status(500).json({
          success: false,
          error: "Erro interno do servidor",
          details: error.message,
        });
        return;
      }

      console.log("✅ Agendamentos encontrados:", data?.length || 0);
      res.json({
        success: true,
        data: data || [],
      });
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

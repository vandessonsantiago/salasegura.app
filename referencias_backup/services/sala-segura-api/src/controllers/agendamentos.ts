import { Request, Response } from "express"
import { supabase } from "../config/supabase"
import { deleteCalendarEvent } from "../services/google-calendar"
import {
  Agendamento,
  CreateAgendamentoRequest,
  UpdateAgendamentoRequest,
  AgendamentoResponse,
  AgendamentosResponse,
} from "../types/agendamentos"

// Extender o tipo Request para incluir user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
  }
}

export class AgendamentosController {
  // Buscar todos os agendamentos do usuário
  static async getUserAgendamentos(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.id

      if (!userId) {
        res.status(401).json({
          success: false,
          error: "Usuário não autenticado",
        })
        return
      }

      const { data, error } = await supabase
        .from("agendamentos")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Erro ao buscar agendamentos:", error)
        res.status(500).json({
          success: false,
          error: "Erro interno do servidor",
        })
        return
      }

      res.json({
        success: true,
        data: data || [],
      })
    } catch (error) {
      console.error("Erro no controller getUserAgendamentos:", error)
      res.status(500).json({
        success: false,
        error: "Erro interno do servidor",
      })
    }
  }

  // Buscar agendamento específico
  static async getAgendamento(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.id
      const { id } = req.params

      if (!userId) {
        res.status(401).json({
          success: false,
          error: "Usuário não autenticado",
        })
        return
      }

      const { data, error } = await supabase
        .from("agendamentos")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .single()

      if (error) {
        if (error.code === "PGRST116") {
          res.status(404).json({
            success: false,
            error: "Agendamento não encontrado",
          })
          return
        }

        console.error("Erro ao buscar agendamento:", error)
        res.status(500).json({
          success: false,
          error: "Erro interno do servidor",
        })
        return
      }

      res.json({
        success: true,
        data,
      })
    } catch (error) {
      console.error("Erro no controller getAgendamento:", error)
      res.status(500).json({
        success: false,
        error: "Erro interno do servidor",
      })
    }
  }

  // Criar novo agendamento
  static async createAgendamento(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.id
      const agendamentoData: CreateAgendamentoRequest = req.body

      if (!userId) {
        res.status(401).json({
          success: false,
          error: "Usuário não autenticado",
        })
        return
      }

      // Validar dados obrigatórios
      const requiredFields = [
        "data",
        "horario",
        "valor",
        "descricao",
        "cliente_nome",
        "cliente_email",
        "cliente_telefone",
      ]
      for (const field of requiredFields) {
        if (!agendamentoData[field as keyof CreateAgendamentoRequest]) {
          res.status(400).json({
            success: false,
            error: `Campo obrigatório: ${field}`,
          })
          return
        }
      }

      // Definir data de expiração do PIX (12h antes do evento)
      const eventDate = new Date(
        `${agendamentoData.data}T${agendamentoData.horario}`
      )
      const pixExpiresAt = new Date(eventDate.getTime() - 12 * 60 * 60 * 1000) // 12h antes

      const { data, error } = await supabase
        .from("agendamentos")
        .insert({
          user_id: userId,
          ...agendamentoData,
          calendar_event_id: (agendamentoData as any).calendar_event_id,
          google_meet_link: (agendamentoData as any).google_meet_link,
          pix_expires_at: pixExpiresAt.toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error("Erro ao criar agendamento:", error)
        res.status(500).json({
          success: false,
          error: "Erro interno do servidor",
        })
        return
      }

      res.status(201).json({
        success: true,
        data,
        message: "Agendamento criado com sucesso",
      })
    } catch (error) {
      console.error("Erro no controller createAgendamento:", error)
      res.status(500).json({
        success: false,
        error: "Erro interno do servidor",
      })
    }
  }

  // Atualizar agendamento
  static async updateAgendamento(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.id
      const { id } = req.params
      const updateData: UpdateAgendamentoRequest = req.body

      if (!userId) {
        res.status(401).json({
          success: false,
          error: "Usuário não autenticado",
        })
        return
      }

      // Verificar se o agendamento existe e pertence ao usuário
      const { data: existingAgendamento, error: checkError } = await supabase
        .from("agendamentos")
        .select("id, calendar_event_id")
        .eq("id", id)
        .eq("user_id", userId)
        .single()

      if (checkError || !existingAgendamento) {
        res.status(404).json({
          success: false,
          error: "Agendamento não encontrado",
        })
        return
      }

      const { data, error } = await supabase
        .from("agendamentos")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single()

      if (error) {
        console.error("Erro ao atualizar agendamento:", error)
        res.status(500).json({
          success: false,
          error: "Erro interno do servidor",
        })
        return
      }

      res.json({
        success: true,
        data,
        message: "Agendamento atualizado com sucesso",
      })
    } catch (error) {
      console.error("Erro no controller updateAgendamento:", error)
      res.status(500).json({
        success: false,
        error: "Erro interno do servidor",
      })
    }
  }

  // Deletar agendamento
  static async deleteAgendamento(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.id
      const { id } = req.params

      if (!userId) {
        res.status(401).json({
          success: false,
          error: "Usuário não autenticado",
        })
        return
      }

      // Verificar se o agendamento existe e pertence ao usuário
      const { data: existingAgendamento, error: checkError } = await supabase
        .from("agendamentos")
        .select("id, calendar_event_id, status")
        .eq("id", id)
        .eq("user_id", userId)
        .single()

      if (checkError || !existingAgendamento) {
        res.status(404).json({
          success: false,
          error: "Agendamento não encontrado",
        })
        return
      }

      // Se o agendamento tem evento no Google Calendar, deletar
      if (existingAgendamento.calendar_event_id) {
        try {
          await deleteCalendarEvent(existingAgendamento.calendar_event_id)
          console.log(
            `✅ Evento do Google Calendar deletado: ${existingAgendamento.calendar_event_id}`
          )
        } catch (calendarError) {
          console.error(
            "Erro ao deletar evento do Google Calendar:",
            calendarError
          )
          // Continuar mesmo se falhar ao deletar do Calendar
        }
      }

      // Atualizar status para CANCELLED em vez de deletar
      const { error } = await supabase
        .from("agendamentos")
        .update({
          status: "CANCELLED",
          payment_status: "CANCELLED",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", userId)

      if (error) {
        console.error("Erro ao cancelar agendamento:", error)
        res.status(500).json({
          success: false,
          error: "Erro interno do servidor",
        })
        return
      }

      res.json({
        success: true,
        message: "Agendamento cancelado com sucesso",
      })
    } catch (error) {
      console.error("Erro no controller deleteAgendamento:", error)
      res.status(500).json({
        success: false,
        error: "Erro interno do servidor",
      })
    }
  }

  // Atualizar status do pagamento
  static async updatePaymentStatus(req: Request, res: Response): Promise<void> {
    try {
      const { payment_id } = req.params
      const { status } = req.body

      if (!payment_id || !status) {
        res.status(400).json({
          success: false,
          error: "payment_id e status são obrigatórios",
        })
        return
      }

      const { data, error } = await supabase
        .from("agendamentos")
        .update({
          payment_status: status,
          status: status === "CONFIRMED" ? "CONFIRMED" : "PENDING",
        })
        .eq("payment_id", payment_id)
        .select()
        .single()

      if (error) {
        console.error("Erro ao atualizar status do pagamento:", error)
        res.status(500).json({
          success: false,
          error: "Erro interno do servidor",
        })
        return
      }

      res.json({
        success: true,
        data,
        message: "Status do pagamento atualizado com sucesso",
      })
    } catch (error) {
      console.error("Erro no controller updatePaymentStatus:", error)
      res.status(500).json({
        success: false,
        error: "Erro interno do servidor",
      })
    }
  }

  // Cancelar agendamentos expirados
  static async cancelExpiredAgendamentos(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { data, error } = await supabase.rpc("cancel_expired_agendamentos")

      if (error) {
        console.error("Erro ao cancelar agendamentos expirados:", error)
        res.status(500).json({
          success: false,
          error: "Erro interno do servidor",
        })
        return
      }

      res.json({
        success: true,
        message: "Agendamentos expirados cancelados com sucesso",
      })
    } catch (error) {
      console.error("Erro no controller cancelExpiredAgendamentos:", error)
      res.status(500).json({
        success: false,
        error: "Erro interno do servidor",
      })
    }
  }
}

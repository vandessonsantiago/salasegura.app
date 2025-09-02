import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { supabaseAdmin as supabase } from '../../lib/supabase';
import { DivorceService } from '../services/DivorceService';

// Tipo para request autenticado
type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    email: string;
  };
};

class DivorcioController {
  // Método para iniciar o caso de divórcio
  static async iniciarCaso(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Usuário não autenticado.' });
        return;
      }

      const { type } = req.body;

      // Gerar UUID explicitamente para garantir que não seja null
      const caseId = randomUUID();

      const { data, error } = await supabase
        .from('divorce_cases')
        .insert({
          id: caseId,
          user_id: userId,
          type: type || 'express',
          status: 'pending_payment'
        })
        .select('id')
        .single();

      if (error) {
        console.error('Erro ao iniciar caso de divórcio:', error);
        res.status(400).json({ success: false, error: error.message });
        return;
      }

      res.status(201).json({ success: true, data: { caseId: data.id } });
    } catch (error) {
      console.error('Erro ao iniciar caso de divórcio:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
    }
  }

  // Método para iniciar o caso de divórcio com dados de pagamento completos
  static async iniciarCasoComPagamento(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Usuário não autenticado.' });
        return;
      }

      const { type, paymentId, qrCodePix, copyPastePix, pixExpiresAt } = req.body;

      // Gerar UUID explicitamente para garantir que não seja null
      const caseId = randomUUID();

      // Por enquanto, vamos armazenar apenas os dados do PIX sem o payment_id
      // para evitar o erro de conversão de tipo UUID
      const { data, error } = await supabase
        .from('divorce_cases')
        .insert({
          id: caseId,
          user_id: userId,
          type: type || 'express',
          status: 'pending_payment',
          // payment_id: paymentId, // Removido temporariamente
          qr_code_pix: qrCodePix,
          copy_paste_pix: copyPastePix,
          pix_expires_at: pixExpiresAt
        })
        .select('id')
        .single();

      if (error) {
        console.error('Erro ao iniciar caso de divórcio com pagamento:', error);
        res.status(400).json({ success: false, error: error.message });
        return;
      }

      // Se conseguimos criar o caso, vamos tentar atualizar o payment_id separadamente
      if (data?.id) {
        // Tentar atualizar o payment_id usando uma abordagem diferente
        try {
          await supabase
            .from('divorce_cases')
            .update({ 
              payment_id: paymentId,
              updated_at: new Date().toISOString()
            })
            .eq('id', data.id);
        } catch (updateError) {
          console.warn('Não foi possível atualizar payment_id, mas caso foi criado:', updateError);
        }
      }

      res.status(201).json({ success: true, data: { caseId: data.id } });
    } catch (error) {
      console.error('Erro ao iniciar caso de divórcio com pagamento:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
    }
  }

  // Método para consultar o status do caso de divórcio
  static async consultarStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('divorce_cases')
        .select('id, status')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erro ao consultar status do caso de divórcio:', error);
        res.status(404).json({ success: false, error: 'Caso de divórcio não encontrado.' });
        return;
      }

      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Erro ao consultar status do caso de divórcio:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
    }
  }

  // Método para atualizar informações de pagamento
  static async atualizarPagamento(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { paymentId, qrCodePix, copyPastePix, pixExpiresAt } = req.body;

      // Primeiro, vamos atualizar apenas os campos que não causam problemas
      const updateData: any = {
        qr_code_pix: qrCodePix,
        copy_paste_pix: copyPastePix,
        pix_expires_at: pixExpiresAt,
        updated_at: new Date().toISOString()
      };

      // Só adiciona payment_id se for fornecido e não for um ID do Asaas problemático
      if (paymentId && !paymentId.startsWith('pay_')) {
        updateData.payment_id = paymentId;
      }

      const { data, error } = await supabase
        .from('divorce_cases')
        .update(updateData)
        .eq('id', id)
        .select('id, status')
        .single();

      if (error) {
        console.error('Erro ao atualizar pagamento:', error);
        res.status(400).json({ success: false, error: error.message });
        return;
      }

      // Se temos um paymentId do Asaas, vamos tentar atualizá-lo separadamente
      if (paymentId && paymentId.startsWith('pay_') && data?.id) {
        try {
          await supabase
            .from('divorce_cases')
            .update({ 
              payment_id: paymentId,
              updated_at: new Date().toISOString()
            })
            .eq('id', data.id);
        } catch (updateError) {
          console.warn('Não foi possível atualizar payment_id do Asaas:', updateError);
        }
      }

      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Erro ao atualizar pagamento:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
    }
  }

  // Método para atualizar status do caso
  static async atualizarStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const { data, error } = await supabase
        .from('divorce_cases')
        .update({
          status
        })
        .eq('id', id)
        .select('id, status')
        .single();

      if (error) {
        console.error('Erro ao atualizar status:', error);
        res.status(400).json({ success: false, error: error.message });
        return;
      }

      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
    }
  }

  // Método para listar casos do usuário
  static async listarCasosUsuario(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // O userId vem do middleware de autenticação
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Usuário não autenticado.' });
        return;
      }

      const { data, error } = await supabase
        .from('divorce_cases')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao listar casos:', error);
        res.status(400).json({ success: false, error: error.message });
        return;
      }

      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Erro ao listar casos:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
    }
  }

  // Método para consultar detalhes completos do caso de divórcio
  static async consultarDetalhes(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('divorce_cases')
        .select(`
          id,
          user_id,
          type,
          status,
          payment_id,
          qr_code_pix,
          copy_paste_pix,
          pix_expires_at,
          created_at,
          updated_at
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erro ao consultar detalhes do caso de divórcio:', error);
        res.status(404).json({ success: false, error: 'Caso de divórcio não encontrado.' });
        return;
      }

      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Erro ao consultar detalhes do caso de divórcio:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
    }
  }
}

export default DivorcioController;

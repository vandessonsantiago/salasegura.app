import { Request, Response } from 'express';
import { supabaseAdmin as supabase } from '../lib/supabase';

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

      const { data, error } = await supabase
        .from('divorce_cases')
        .insert({
          user_id: userId,
          type,
          status: 'pending_payment', // Atualizado para refletir o status de pagamento pendente
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
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

      const { data, error } = await supabase
        .from('divorce_cases')
        .update({
          payment_id: paymentId,
          qr_code_pix: qrCodePix,
          copy_paste_pix: copyPastePix,
          pix_expires_at: pixExpiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('id, status')
        .single();

      if (error) {
        console.error('Erro ao atualizar pagamento:', error);
        res.status(400).json({ success: false, error: error.message });
        return;
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
          status,
          updated_at: new Date().toISOString(),
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
}

export default DivorcioController;

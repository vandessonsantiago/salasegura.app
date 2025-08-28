import { Request, Response } from 'express';
import { supabaseAdmin as supabase } from '../lib/supabase';

class DivorcioController {
  // Método para iniciar o caso de divórcio
  static async iniciarCaso(req: Request, res: Response): Promise<void> {
    try {
      const { userId, type } = req.body;

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
  static async consultarStatus(req: Request, res: Response): Promise<void> {
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

  // Método para finalizar o caso de divórcio
  static async finalizarCaso(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('divorce_cases')
        .update({
          status: 'finalizado',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('id, status')
        .single();

      if (error) {
        console.error('Erro ao finalizar caso de divórcio:', error);
        res.status(404).json({ success: false, error: 'Caso de divórcio não encontrado.' });
        return;
      }

      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Erro ao finalizar caso de divórcio:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
    }
  }
}

export default DivorcioController;

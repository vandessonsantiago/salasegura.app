import express, { Request, Response, Router } from 'express';
import { authenticateToken } from '../../middleware/auth';
import { ChecklistService } from '../services/ChecklistService';

const router: Router = express.Router();

// Listar sessões do usuário
router.get('/sessions', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const sessions = await ChecklistService.listSessions(userId);
    res.json({ sessions });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to list sessions' });
  }
});

// Criar nova sessão
router.post('/sessions', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { title } = req.body || {};
  console.log('[Checklist] Criando sessão para usuário', userId, 'title:', title);
    const session = await ChecklistService.createSession(userId, title);
  console.log('[Checklist] Sessão criada', session?.id, 'itens:', session?.items?.length);
    res.status(201).json({ session });
  } catch (error: any) {
  console.error('[Checklist] Erro ao criar sessão', error);
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'Usuário não sincronizado na base local (FK). Faça login novamente ou chame /api/user/profile para sincronizar.' });
    }
    res.status(500).json({ error: error.message || 'Failed to create session' });
  }
});

// Obter sessão com itens
router.get('/sessions/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const session = await ChecklistService.getSessionWithItems(userId, req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json({ session });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to load session' });
  }
});

// Atualizar item (toggle)
router.put('/sessions/:id/items/:itemId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { completed } = req.body;
    if (typeof completed !== 'boolean') return res.status(400).json({ error: 'completed boolean required' });
    const updated = await ChecklistService.updateItem(userId, req.params.id, req.params.itemId, completed);
    res.json({ session: updated });
  } catch (error: any) {
    if (error.message === 'Session not found' || error.message === 'Item not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || 'Failed to update item' });
  }
});

// Deletar sessão
router.delete('/sessions/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    await ChecklistService.deleteSession(userId, req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Session not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || 'Failed to delete session' });
  }
});

export default router;
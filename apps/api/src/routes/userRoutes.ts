import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authenticateToken } from '../middleware/auth';

const router: Router = Router();

// Rotas protegidas (requerem autenticação)
router.get('/profile', authenticateToken, UserController.getProfile);
router.put('/profile', authenticateToken, UserController.updateProfile);
router.put('/profile/extended', authenticateToken, UserController.updateExtendedProfile);
router.post('/session', authenticateToken, UserController.createSession);
router.post('/activity', authenticateToken, UserController.logActivity);

// Webhook para sincronização com Supabase (sem autenticação - deve ser protegido por outros meios)
router.post('/sync', UserController.syncUser);

export default router;

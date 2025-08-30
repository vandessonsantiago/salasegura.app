import { Router } from 'express';
import DivorcioController from '../controllers/DivorcioController';
import { authenticateToken } from '../middleware/auth';

const router: Router = Router();

// Endpoint para iniciar o serviço de divórcio (requer autenticação)
router.post('/iniciar', authenticateToken, DivorcioController.iniciarCaso);

// Endpoint para iniciar o serviço de divórcio com dados de pagamento (requer autenticação)
router.post('/iniciar-com-pagamento', authenticateToken, DivorcioController.iniciarCasoComPagamento);

// Endpoint para consultar o status do caso de divórcio (requer autenticação)
router.get('/:id/status', authenticateToken, DivorcioController.consultarStatus);

// Endpoint para consultar detalhes completos do caso (requer autenticação)
router.get('/:id/detalhes', authenticateToken, DivorcioController.consultarDetalhes);

// Endpoint para atualizar informações de pagamento (requer autenticação)
router.patch('/:id/pagamento', authenticateToken, DivorcioController.atualizarPagamento);

// Endpoint para atualizar status do caso (requer autenticação)
router.patch('/:id/status', authenticateToken, DivorcioController.atualizarStatus);

// Endpoint para listar casos do usuário (requer autenticação)
router.get('/cases', authenticateToken, DivorcioController.listarCasosUsuario);

export default router;

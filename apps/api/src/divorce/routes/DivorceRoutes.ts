import { Router } from 'express';
import DivorceController from '../controllers/DivorceController';
import { authenticateToken } from '../../middleware/auth';

const router: Router = Router();

// Endpoint para iniciar o serviço de divórcio (requer autenticação)
router.post('/iniciar', authenticateToken, DivorceController.iniciarCaso);

// Endpoint para iniciar o serviço de divórcio com dados de pagamento (requer autenticação)
// Rota duplicada - REMOVIDA para evitar criação de casos duplicados
// O checkout já cria o caso completo com dados do cliente e PIX
// router.post('/iniciar-com-pagamento', authenticateToken, DivorceController.iniciarCasoComPagamento);

// Endpoint para consultar o status do caso de divórcio (requer autenticação)
router.get('/:id/status', authenticateToken, DivorceController.consultarStatus);

// Endpoint para consultar detalhes completos do caso (requer autenticação)
router.get('/:id/detalhes', authenticateToken, DivorceController.consultarDetalhes);

// Endpoint para atualizar informações de pagamento (requer autenticação)
router.patch('/:id/pagamento', authenticateToken, DivorceController.atualizarPagamento);

// Endpoint para atualizar status do caso (requer autenticação)
router.patch('/:id/status', authenticateToken, DivorceController.atualizarStatus);

// Endpoint para listar casos do usuário (requer autenticação)
router.get('/cases', authenticateToken, DivorceController.listarCasosUsuario);

export default router;

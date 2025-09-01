import { Router } from 'express';
import { AgendamentoController } from '../controllers/AgendamentoController';
import { authenticateToken } from '../middleware/auth';

const router: Router = Router();

// Buscar agendamento do usuário (temporariamente sem auth para debug)
router.get('/meu-agendamento', AgendamentoController.buscarAgendamentoUsuario);

// Aplicar middleware de autenticação a todas as rotas
router.use(authenticateToken);

// Criar novo agendamento
router.post('/', AgendamentoController.criarAgendamento);

// Processar pagamento do agendamento
router.post('/processar-pagamento', AgendamentoController.processarPagamento);

// Confirmar agendamento (usado pelo webhook)
router.post('/confirmar', AgendamentoController.confirmarAgendamento);

// Cancelar agendamento
router.post('/cancelar', AgendamentoController.cancelarAgendamento);

export default router;

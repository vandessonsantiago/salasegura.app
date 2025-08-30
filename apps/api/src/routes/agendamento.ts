import { Router } from 'express';
import { AgendamentoController } from '../controllers/AgendamentoController';
import { authenticateToken } from '../middleware/auth';

const router: Router = Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken);

// Criar agendamento básico
router.post('/basico', AgendamentoController.criarAgendamentoBasico);

// Buscar agendamento por ID
router.get('/:id', AgendamentoController.buscarAgendamento);

// Listar agendamentos do usuário
router.get('/', AgendamentoController.listarAgendamentosUsuario);

// Atualizar dados do cliente
router.patch('/:id/cliente', AgendamentoController.atualizarDadosCliente);

export default router;

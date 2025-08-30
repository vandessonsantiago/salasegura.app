import { Router } from 'express';
import { AgendamentosController } from '../controllers/AgendamentosController';
import { authenticateToken } from '../middleware/auth';

const router: Router = Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken);

// Listar agendamentos do usuário
router.get('/', AgendamentosController.getUserAgendamentos);

// Criar agendamento
router.post('/', AgendamentosController.createAgendamento);

// Buscar agendamento por ID
router.get('/:id', AgendamentosController.getAgendamento);

// Atualizar agendamento
router.put('/:id', AgendamentosController.updateAgendamento);

// Deletar agendamento
router.delete('/:id', AgendamentosController.deleteAgendamento);

export default router;

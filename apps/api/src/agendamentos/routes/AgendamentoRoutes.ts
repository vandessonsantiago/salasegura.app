import { Router } from 'express';
import { AgendamentoController } from '../controllers/AgendamentoController';
import { authenticateToken } from '../../middleware/auth';

const router: Router = Router();

// Aplicar middleware de autenticação a todas as rotas
router.use(authenticateToken);

/**
 * @route GET /api/agendamentos
 * @desc Buscar todos os agendamentos do usuário
 * @access Private
 */
router.get('/', AgendamentoController.getUserAgendamentos);

/**
 * @route POST /api/agendamentos
 * @desc Criar novo agendamento
 * @access Private
 */
router.post('/', AgendamentoController.createAgendamento);

/**
 * @route GET /api/agendamentos/:id
 * @desc Buscar agendamento específico
 * @access Private
 */
router.get('/:id', AgendamentoController.getAgendamento);

/**
 * @route PUT /api/agendamentos/:id
 * @desc Atualizar agendamento
 * @access Private
 */
router.put('/:id', AgendamentoController.updateAgendamento);

/**
 * @route DELETE /api/agendamentos/:id
 * @desc Deletar agendamento
 * @access Private
 */
router.delete('/:id', AgendamentoController.deleteAgendamento);

/**
 * @route GET /api/agendamentos/user/meu-agendamento
 * @desc Buscar agendamento do usuário (último ativo)
 * @access Private
 */
router.get('/user/meu-agendamento', AgendamentoController.buscarAgendamentoUsuario);

/**
 * @route POST /api/agendamentos/:id/processar-pagamento
 * @desc Processar pagamento do agendamento
 * @access Private
 */
router.post('/:id/processar-pagamento', AgendamentoController.processarPagamento);

/**
 * @route POST /api/agendamentos/:id/confirmar
 * @desc Confirmar agendamento
 * @access Private
 */
router.post('/:id/confirmar', AgendamentoController.confirmarAgendamento);

/**
 * @route POST /api/agendamentos/:id/cancelar
 * @desc Cancelar agendamento
 * @access Private
 */
router.post('/:id/cancelar', AgendamentoController.cancelarAgendamento);

export { router };

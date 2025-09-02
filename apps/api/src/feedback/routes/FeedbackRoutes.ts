import { Router } from 'express';
import { FeedbackController } from '../controllers/FeedbackController';
import { authenticateToken } from '../../middleware/auth';

const router: Router = Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken);

/**
 * @route POST /api/feedback
 * @desc Criar um novo feedback
 * @access Private
 */
router.post('/', FeedbackController.createFeedback);

/**
 * @route GET /api/feedback
 * @desc Buscar feedback do usuário autenticado
 * @access Private
 */
router.get('/', FeedbackController.getUserFeedback);

/**
 * @route GET /api/feedback/:id
 * @desc Buscar um feedback específico
 * @access Private
 */
router.get('/:id', FeedbackController.getFeedbackById);

/**
 * @route PATCH /api/feedback/:id/status
 * @desc Atualizar status do feedback
 * @access Private
 */
router.patch('/:id/status', FeedbackController.updateFeedbackStatus);

export { router };

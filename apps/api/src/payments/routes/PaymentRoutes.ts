// MÓDULO PAYMENTS - ROTAS

import express, { Router } from 'express';
import { PaymentController } from '../controllers/PaymentController';
import { authenticateToken } from '../../middleware/auth';

const router: Router = express.Router();

// Middleware de autenticação para todas as rotas
router.use(authenticateToken);

// Rota para processar checkout completo
router.post('/checkout', PaymentController.processarCheckout);

// Rota para listar pagamentos do usuário
router.get('/payments', PaymentController.listarPagamentos);

// Rota para buscar pagamento específico
router.get('/payments/:paymentId', PaymentController.buscarPagamento);

// Rota para atualizar status de pagamento (webhook)
router.post('/payments/status', PaymentController.atualizarStatusPagamento);

export { router as PaymentRoutes };

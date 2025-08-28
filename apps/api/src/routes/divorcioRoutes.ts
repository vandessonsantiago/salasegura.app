import { Router } from 'express';
import DivorcioController from '../controllers/DivorcioController';

const router: Router = Router();

// Endpoint para iniciar o serviço de divórcio após pagamento
router.post('/iniciar', DivorcioController.iniciarCaso);

// Endpoint para consultar o status do caso de divórcio
router.get('/:id/status', DivorcioController.consultarStatus);

export default router;

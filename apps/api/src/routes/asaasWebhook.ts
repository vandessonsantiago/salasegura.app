import { Router, Request, Response } from 'express';
import { WebhookService } from '../services/WebhookService';

const router: Router = Router();

// Webhook do Asaas para atualização de status de pagamento
router.post('/', async (req: Request, res: Response) => {
  try {
    const result = await WebhookService.processarWebhookAsaas(req.body);

    if (result.success) {
      res.status(200).json({ success: true, message: result.message });
    } else {
      res.status(500).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error('❌ Erro geral no webhook Asaas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno no processamento do webhook'
    });
  }
});

export default router;

import { Router } from "express";
import HealthController from "../controllers/healthController";

const router: Router = Router();
const healthController = new HealthController();

// GET /health/status
router.get("/status", healthController.getStatus);

export default router;

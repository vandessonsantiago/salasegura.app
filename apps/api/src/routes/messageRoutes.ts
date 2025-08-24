import { Router } from "express";
import MessageController from "../controllers/messageController";

const router: Router = Router();
const messageController = new MessageController();

// GET /message/:name
router.get("/:name", messageController.getMessage);

export default router;

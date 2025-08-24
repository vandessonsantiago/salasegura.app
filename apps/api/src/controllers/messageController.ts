import { Request, Response } from "express";
import { MessageService } from "../services/MessageService";

export class MessageController {
  private messageService: MessageService;

  constructor() {
    this.messageService = new MessageService();
  }

  public getMessage = (req: Request, res: Response) => {
    try {
      const { name } = req.params;
      const message = this.messageService.createGreeting(name);
      return res.json({ message });
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}

export default MessageController;

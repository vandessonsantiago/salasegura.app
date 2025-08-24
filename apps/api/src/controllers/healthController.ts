import { Request, Response } from "express";
import { HealthService } from "../services/HealthService";

export class HealthController {
  private healthService: HealthService;

  constructor() {
    this.healthService = new HealthService();
  }

  public getStatus = (req: Request, res: Response) => {
    try {
      const status = this.healthService.getHealthStatus();
      return res.json(status);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}

export default HealthController;

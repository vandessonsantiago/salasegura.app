export class HealthService {
  public getHealthStatus() {
    return {
      ok: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || "1.0.0",
    };
  }
}

export default HealthService;

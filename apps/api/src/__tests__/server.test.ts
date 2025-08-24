import supertest from "supertest";
import { describe, it, expect } from "@jest/globals";
import { createApp } from "../app";

describe("API Server", () => {
  const app = createApp();

  describe("Health endpoints", () => {
    it("health check returns 200", async () => {
      await supertest(app)
        .get("/api/health/status")
        .expect(200)
        .then((res) => {
          expect(res.body).toHaveProperty("ok", true);
          expect(res.body).toHaveProperty("timestamp");
          expect(res.body).toHaveProperty("uptime");
          expect(res.body).toHaveProperty("version");
        });
    });

    it("legacy status endpoint redirects to health", async () => {
      await supertest(app)
        .get("/status")
        .expect(302);
    });
  });

  describe("Message endpoints", () => {
    it("message endpoint says hello", async () => {
      await supertest(app)
        .get("/api/message/jared")
        .expect(200)
        .then((res) => {
          expect(res.body).toEqual({ message: "hello jared" });
        });
    });

    it("legacy message endpoint redirects", async () => {
      await supertest(app)
        .get("/message/test")
        .expect(302);
    });
  });
});

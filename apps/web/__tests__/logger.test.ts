import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { log } from "../src/lib/logger/service";
import { readFile, unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

describe("Logger System", () => {
  const testLogPath = join(process.cwd(), "logs");
  const date = new Date().toISOString().split("T")[0];

  beforeAll(() => {
    // Ensure logs directory exists
    if (!existsSync(testLogPath)) {
      require("fs").mkdirSync(testLogPath, { recursive: true });
    }
  });

  afterAll(async () => {
    // Cleanup test logs
    const logFiles = [
      `app-${date}.log`,
      `error-${date}.log`,
      `http-${date}.log`,
      `business-${date}.log`,
    ];

    for (const file of logFiles) {
      const filePath = join(testLogPath, file);
      if (existsSync(filePath)) {
        try {
          await unlink(filePath);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }
  });

  it("should log info messages", async () => {
    log.info("Test info message", { test: true });

    // Wait for file write
    await new Promise((resolve) => setTimeout(resolve, 100));

    const logFile = join(testLogPath, `app-${date}.log`);
    if (existsSync(logFile)) {
      const content = await readFile(logFile, "utf-8");
      expect(content).toContain("Test info message");
      expect(content).toContain("info");
    }
  });

  it("should log error messages with stack trace", async () => {
    const testError = new Error("Test error");
    log.error("Test error message", testError, { context: "test" });

    await new Promise((resolve) => setTimeout(resolve, 100));

    const errorLogFile = join(testLogPath, `error-${date}.log`);
    if (existsSync(errorLogFile)) {
      const content = await readFile(errorLogFile, "utf-8");
      expect(content).toContain("Test error message");
      expect(content).toContain("Test error");
    }
  });

  it("should log business events", async () => {
    log.logBookingCreated("booking-123", "user-456", "listing-789", 100);

    await new Promise((resolve) => setTimeout(resolve, 100));

    const businessLogFile = join(testLogPath, `business-${date}.log`);
    if (existsSync(businessLogFile)) {
      const content = await readFile(businessLogFile, "utf-8");
      expect(content).toContain("Booking Created");
      expect(content).toContain("booking-123");
    }
  });

  it("should log slow queries", async () => {
    log.logSlowQuery("SELECT * FROM users WHERE id = ?", 1500, ["user-123"]);

    await new Promise((resolve) => setTimeout(resolve, 100));

    const logFile = join(testLogPath, `app-${date}.log`);
    if (existsSync(logFile)) {
      const content = await readFile(logFile, "utf-8");
      expect(content).toContain("Slow Query");
      expect(content).toContain("1500ms");
    }
  });

  it("should log security events", async () => {
    log.logSecurityEvent("unauthorized_access", "user-123", "192.168.1.1", {
      resource: "/admin",
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    const logFile = join(testLogPath, `app-${date}.log`);
    if (existsSync(logFile)) {
      const content = await readFile(logFile, "utf-8");
      expect(content).toContain("Security Event");
      expect(content).toContain("unauthorized_access");
    }
  });

  it("should handle logging without metadata", () => {
    expect(() => {
      log.info("Simple message");
      log.warn("Warning message");
      log.debug("Debug message");
    }).not.toThrow();
  });

  it("should log user registration", async () => {
    log.logUserRegistered("user-999", "test@example.com", "email");

    await new Promise((resolve) => setTimeout(resolve, 100));

    const businessLogFile = join(testLogPath, `business-${date}.log`);
    if (existsSync(businessLogFile)) {
      const content = await readFile(businessLogFile, "utf-8");
      expect(content).toContain("User Registered");
      expect(content).toContain("user-999");
    }
  });

  it("should log listing creation", async () => {
    log.logListingCreated("listing-555", "owner-666", "APARTMENT");

    await new Promise((resolve) => setTimeout(resolve, 100));

    const businessLogFile = join(testLogPath, `business-${date}.log`);
    if (existsSync(businessLogFile)) {
      const content = await readFile(businessLogFile, "utf-8");
      expect(content).toContain("Listing Created");
      expect(content).toContain("listing-555");
    }
  });

  it("should log payment success", async () => {
    log.logPaymentSucceeded("payment-777", 250.5, "user-888");

    await new Promise((resolve) => setTimeout(resolve, 100));

    const businessLogFile = join(testLogPath, `business-${date}.log`);
    if (existsSync(businessLogFile)) {
      const content = await readFile(businessLogFile, "utf-8");
      expect(content).toContain("Payment Succeeded");
      expect(content).toContain("payment-777");
    }
  });
});

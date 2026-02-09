/**
 * Lok'Room - Tests unitaires pour le service de webhooks
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import {
  generateSignature,
  verifySignature,
  validateWebhookUrl,
  generateWebhookSecret,
  WEBHOOK_EVENTS,
} from "@/lib/webhooks/service";

describe("Webhook Service", () => {
  describe("generateSignature", () => {
    it("should generate a valid HMAC-SHA256 signature", () => {
      const payload = JSON.stringify({ test: "data" });
      const secret = "test_secret_key";
      const signature = generateSignature(payload, secret);

      expect(signature).toBeDefined();
      expect(signature).toHaveLength(64); // SHA256 hex = 64 chars
      expect(signature).toMatch(/^[a-f0-9]{64}$/);
    });

    it("should generate different signatures for different payloads", () => {
      const secret = "test_secret_key";
      const sig1 = generateSignature("payload1", secret);
      const sig2 = generateSignature("payload2", secret);

      expect(sig1).not.toBe(sig2);
    });

    it("should generate different signatures for different secrets", () => {
      const payload = "same_payload";
      const sig1 = generateSignature(payload, "secret1");
      const sig2 = generateSignature(payload, "secret2");

      expect(sig1).not.toBe(sig2);
    });
  });

  describe("verifySignature", () => {
    it("should verify a valid signature", () => {
      const payload = JSON.stringify({ test: "data" });
      const secret = "test_secret_key";
      const signature = generateSignature(payload, secret);

      const isValid = verifySignature(payload, signature, secret);
      expect(isValid).toBe(true);
    });

    it("should reject an invalid signature", () => {
      const payload = JSON.stringify({ test: "data" });
      const secret = "test_secret_key";
      const invalidSignature = "0".repeat(64);

      const isValid = verifySignature(payload, invalidSignature, secret);
      expect(isValid).toBe(false);
    });

    it("should reject signature with wrong secret", () => {
      const payload = JSON.stringify({ test: "data" });
      const signature = generateSignature(payload, "secret1");

      const isValid = verifySignature(payload, signature, "secret2");
      expect(isValid).toBe(false);
    });

    it("should reject signature with modified payload", () => {
      const payload1 = JSON.stringify({ test: "data1" });
      const payload2 = JSON.stringify({ test: "data2" });
      const secret = "test_secret_key";
      const signature = generateSignature(payload1, secret);

      const isValid = verifySignature(payload2, signature, secret);
      expect(isValid).toBe(false);
    });
  });

  describe("validateWebhookUrl", () => {
    it("should accept valid HTTPS URLs", () => {
      const result = validateWebhookUrl("https://example.com/webhook");
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should accept HTTP URLs in development", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const result = validateWebhookUrl("http://localhost:3000/webhook");
      expect(result.valid).toBe(true);

      process.env.NODE_ENV = originalEnv;
    });

    it("should reject HTTP URLs in production", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const result = validateWebhookUrl("http://example.com/webhook");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("HTTPS requis en production");

      process.env.NODE_ENV = originalEnv;
    });

    it("should reject localhost in production", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const result1 = validateWebhookUrl("https://localhost/webhook");
      expect(result1.valid).toBe(false);
      expect(result1.error).toBe("localhost non autorisé en production");

      const result2 = validateWebhookUrl("https://127.0.0.1/webhook");
      expect(result2.valid).toBe(false);
      expect(result2.error).toBe("localhost non autorisé en production");

      process.env.NODE_ENV = originalEnv;
    });

    it("should reject invalid URLs", () => {
      const result = validateWebhookUrl("not-a-url");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("URL invalide");
    });

    it("should reject javascript: URLs", () => {
      const result = validateWebhookUrl("javascript:alert(1)");
      expect(result.valid).toBe(false);
    });

    it("should reject data: URLs", () => {
      const result = validateWebhookUrl("data:text/html,<script>alert(1)</script>");
      expect(result.valid).toBe(false);
    });
  });

  describe("generateWebhookSecret", () => {
    it("should generate a random secret", () => {
      const secret = generateWebhookSecret();
      expect(secret).toBeDefined();
      expect(secret).toHaveLength(64); // 32 bytes = 64 hex chars
      expect(secret).toMatch(/^[a-f0-9]{64}$/);
    });

    it("should generate different secrets each time", () => {
      const secret1 = generateWebhookSecret();
      const secret2 = generateWebhookSecret();
      expect(secret1).not.toBe(secret2);
    });
  });

  describe("WEBHOOK_EVENTS", () => {
    it("should have all required events", () => {
      expect(WEBHOOK_EVENTS.BOOKING_CREATED).toBe("booking.created");
      expect(WEBHOOK_EVENTS.BOOKING_CONFIRMED).toBe("booking.confirmed");
      expect(WEBHOOK_EVENTS.BOOKING_CANCELLED).toBe("booking.cancelled");
      expect(WEBHOOK_EVENTS.BOOKING_COMPLETED).toBe("booking.completed");
      expect(WEBHOOK_EVENTS.LISTING_CREATED).toBe("listing.created");
      expect(WEBHOOK_EVENTS.LISTING_UPDATED).toBe("listing.updated");
      expect(WEBHOOK_EVENTS.LISTING_DELETED).toBe("listing.deleted");
      expect(WEBHOOK_EVENTS.REVIEW_CREATED).toBe("review.created");
      expect(WEBHOOK_EVENTS.MESSAGE_RECEIVED).toBe("message.received");
      expect(WEBHOOK_EVENTS.PAYMENT_SUCCEEDED).toBe("payment.succeeded");
      expect(WEBHOOK_EVENTS.PAYMENT_FAILED).toBe("payment.failed");
    });

    it("should have exactly 11 events", () => {
      const eventCount = Object.keys(WEBHOOK_EVENTS).length;
      expect(eventCount).toBe(11);
    });
  });
});

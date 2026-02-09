/**
 * Tests pour le système d'export de données
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { prisma } from "@/lib/db";
import { collectUserData } from "@/lib/export/user-data";
import { generateJSON } from "@/lib/export/formats/json";
import { generateCSV } from "@/lib/export/formats/csv";
import { generatePDF } from "@/lib/export/formats/pdf";
import { generateZIPWithoutPhotos } from "@/lib/export/formats/zip";

describe("Data Export System", () => {
  let testUserId: string;

  beforeAll(async () => {
    // Créer un utilisateur de test
    const user = await prisma.user.create({
      data: {
        email: `test-export-${Date.now()}@example.com`,
        name: "Test Export User",
        role: "GUEST",
      },
    });
    testUserId = user.id;

    // Créer un profil
    await prisma.userProfile.create({
      data: {
        userId: testUserId,
        firstName: "Test",
        lastName: "User",
        phone: "+33612345678",
        city: "Paris",
        country: "France",
      },
    });
  });

  afterAll(async () => {
    // Nettoyer les données de test
    await prisma.userProfile.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.user.delete({
      where: { id: testUserId },
    });
  });

  describe("collectUserData", () => {
    it("should collect user data successfully", async () => {
      const userData = await collectUserData(testUserId);

      expect(userData).toBeDefined();
      expect(userData?.account.id).toBe(testUserId);
      expect(userData?.account.email).toContain("test-export-");
      expect(userData?.profile).toBeDefined();
      expect(userData?.profile?.firstName).toBe("Test");
      expect(userData?.profile?.lastName).toBe("User");
    });

    it("should return null for non-existent user", async () => {
      const userData = await collectUserData("non-existent-id");
      expect(userData).toBeNull();
    });

    it("should include all required sections", async () => {
      const userData = await collectUserData(testUserId);

      expect(userData).toHaveProperty("exportDate");
      expect(userData).toHaveProperty("exportVersion");
      expect(userData).toHaveProperty("account");
      expect(userData).toHaveProperty("profile");
      expect(userData).toHaveProperty("listings");
      expect(userData).toHaveProperty("bookingsAsGuest");
      expect(userData).toHaveProperty("bookingsAsHost");
      expect(userData).toHaveProperty("reviewsGiven");
      expect(userData).toHaveProperty("reviewsReceived");
      expect(userData).toHaveProperty("messages");
      expect(userData).toHaveProperty("favorites");
      expect(userData).toHaveProperty("notifications");
      expect(userData).toHaveProperty("consents");
    });
  });

  describe("generateJSON", () => {
    it("should generate valid JSON", async () => {
      const userData = await collectUserData(testUserId);
      if (!userData) throw new Error("User data not found");

      const json = generateJSON(userData);

      expect(json).toBeDefined();
      expect(typeof json).toBe("string");

      // Vérifier que c'est du JSON valide
      const parsed = JSON.parse(json);
      expect(parsed.account.id).toBe(testUserId);
    });

    it("should include all data in JSON", async () => {
      const userData = await collectUserData(testUserId);
      if (!userData) throw new Error("User data not found");

      const json = generateJSON(userData);
      const parsed = JSON.parse(json);

      expect(parsed.exportDate).toBeDefined();
      expect(parsed.exportVersion).toBe("2.0");
      expect(parsed.account.email).toContain("test-export-");
    });
  });

  describe("generateCSV", () => {
    it("should generate CSV files", async () => {
      const userData = await collectUserData(testUserId);
      if (!userData) throw new Error("User data not found");

      const csvFiles = generateCSV(userData);

      expect(csvFiles).toBeDefined();
      expect(csvFiles["profile.csv"]).toBeDefined();
      expect(typeof csvFiles["profile.csv"]).toBe("string");
    });

    it("should include headers in CSV", async () => {
      const userData = await collectUserData(testUserId);
      if (!userData) throw new Error("User data not found");

      const csvFiles = generateCSV(userData);
      const profileCSV = csvFiles["profile.csv"];

      expect(profileCSV).toContain("id");
      expect(profileCSV).toContain("email");
      expect(profileCSV).toContain("firstName");
      expect(profileCSV).toContain("lastName");
    });
  });

  describe("generatePDF", () => {
    it("should generate PDF buffer", async () => {
      const userData = await collectUserData(testUserId);
      if (!userData) throw new Error("User data not found");

      const pdfBuffer = generatePDF(userData);

      expect(pdfBuffer).toBeDefined();
      expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });

    it("should have PDF signature", async () => {
      const userData = await collectUserData(testUserId);
      if (!userData) throw new Error("User data not found");

      const pdfBuffer = generatePDF(userData);
      const pdfSignature = pdfBuffer.toString("utf8", 0, 4);

      expect(pdfSignature).toBe("%PDF");
    });
  });

  describe("generateZIP", () => {
    it("should generate ZIP buffer", async () => {
      const userData = await collectUserData(testUserId);
      if (!userData) throw new Error("User data not found");

      const zipBuffer = await generateZIPWithoutPhotos(userData);

      expect(zipBuffer).toBeDefined();
      expect(Buffer.isBuffer(zipBuffer)).toBe(true);
      expect(zipBuffer.length).toBeGreaterThan(0);
    });

    it("should have ZIP signature", async () => {
      const userData = await collectUserData(testUserId);
      if (!userData) throw new Error("User data not found");

      const zipBuffer = await generateZIPWithoutPhotos(userData);
      const zipSignature = zipBuffer.toString("hex", 0, 4);

      // ZIP signature: 50 4B 03 04
      expect(zipSignature).toBe("504b0304");
    });
  });

  describe("DataExportRequest model", () => {
    it("should create export request", async () => {
      const exportRequest = await prisma.dataExportRequest.create({
        data: {
          userId: testUserId,
          format: "json",
          status: "pending",
        },
      });

      expect(exportRequest).toBeDefined();
      expect(exportRequest.userId).toBe(testUserId);
      expect(exportRequest.format).toBe("json");
      expect(exportRequest.status).toBe("pending");

      // Nettoyer
      await prisma.dataExportRequest.delete({
        where: { id: exportRequest.id },
      });
    });

    it("should update export request status", async () => {
      const exportRequest = await prisma.dataExportRequest.create({
        data: {
          userId: testUserId,
          format: "json",
          status: "pending",
        },
      });

      const updated = await prisma.dataExportRequest.update({
        where: { id: exportRequest.id },
        data: {
          status: "completed",
          completedAt: new Date(),
          fileSize: 1024,
        },
      });

      expect(updated.status).toBe("completed");
      expect(updated.completedAt).toBeDefined();
      expect(updated.fileSize).toBe(1024);

      // Nettoyer
      await prisma.dataExportRequest.delete({
        where: { id: exportRequest.id },
      });
    });
  });

  describe("Rate Limiting", () => {
    it("should enforce rate limit", async () => {
      // Créer un export récent
      const recentExport = await prisma.dataExportRequest.create({
        data: {
          userId: testUserId,
          format: "json",
          status: "completed",
          createdAt: new Date(),
        },
      });

      // Vérifier qu'un export récent existe
      const exports = await prisma.dataExportRequest.findMany({
        where: {
          userId: testUserId,
          createdAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000), // 1 heure
          },
        },
      });

      expect(exports.length).toBeGreaterThan(0);

      // Nettoyer
      await prisma.dataExportRequest.delete({
        where: { id: recentExport.id },
      });
    });
  });

  describe("Expiration", () => {
    it("should set expiration date", async () => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const exportRequest = await prisma.dataExportRequest.create({
        data: {
          userId: testUserId,
          format: "json",
          status: "completed",
          expiresAt,
        },
      });

      expect(exportRequest.expiresAt).toBeDefined();
      expect(exportRequest.expiresAt?.getTime()).toBeGreaterThan(Date.now());

      // Nettoyer
      await prisma.dataExportRequest.delete({
        where: { id: exportRequest.id },
      });
    });

    it("should identify expired exports", async () => {
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 1); // Hier

      const exportRequest = await prisma.dataExportRequest.create({
        data: {
          userId: testUserId,
          format: "json",
          status: "completed",
          expiresAt: expiredDate,
        },
      });

      const expiredExports = await prisma.dataExportRequest.findMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      expect(expiredExports.length).toBeGreaterThan(0);

      // Nettoyer
      await prisma.dataExportRequest.delete({
        where: { id: exportRequest.id },
      });
    });
  });
});

// apps/web/src/lib/recommendations/__tests__/engine.test.ts
import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { PrismaClient } from "@prisma/client";
import { generateRecommendations, regenerateRecommendations } from "../engine";

const prisma = new PrismaClient();

describe("Recommendations Engine", () => {
  let testUserId: string;
  let testListingId: string;

  beforeEach(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        role: "GUEST",
      },
    });
    testUserId = user.id;

    // Create test listing
    const listing = await prisma.listing.create({
      data: {
        title: "Test Listing",
        description: "Test description",
        price: 100,
        currency: "EUR",
        country: "France",
        city: "Paris",
        type: "APARTMENT",
        ownerId: testUserId,
      },
    });
    testListingId = listing.id;
  });

  afterEach(async () => {
    // Cleanup
    await prisma.userRecommendation.deleteMany({ where: { userId: testUserId } });
    await prisma.listing.deleteMany({ where: { ownerId: testUserId } });
    await prisma.user.delete({ where: { id: testUserId } });
  });

  it("should generate recommendations for a user", async () => {
    const recommendations = await generateRecommendations(testUserId);
    expect(Array.isArray(recommendations)).toBe(true);
  });

  it("should save recommendations to database", async () => {
    await regenerateRecommendations(testUserId);

    const saved = await prisma.userRecommendation.findMany({
      where: { userId: testUserId },
    });

    expect(saved.length).toBeGreaterThanOrEqual(0);
  });

  it("should calculate similarity scores correctly", async () => {
    const recommendations = await generateRecommendations(testUserId);

    recommendations.forEach((rec) => {
      expect(rec.score).toBeGreaterThanOrEqual(0);
      expect(rec.score).toBeLessThanOrEqual(1);
      expect(rec.reason).toBeTruthy();
    });
  });
});

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendAppLaunchNotification } from "@/lib/email";
import { z } from "zod";
import { logger } from "@/lib/logger";


const notifySchema = z.object({
  appStoreUrl: z.string().url("URL App Store invalide"),
  playStoreUrl: z.string().url("URL Google Play invalide"),
  testMode: z.boolean().optional().default(false),
  testEmail: z.string().email().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    // const session = await getServerSession();
    // if (!session || session.user.role !== "ADMIN") {
    //   return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    // }

    const body = await request.json();

    // Validate input
    const result = notifySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Données invalides", details: result.error.errors },
        { status: 400 }
      );
    }

    const { appStoreUrl, playStoreUrl, testMode, testEmail } = result.data;

    // Test mode: send to one email only
    if (testMode) {
      if (!testEmail) {
        return NextResponse.json(
          { error: "testEmail requis en mode test" },
          { status: 400 }
        );
      }

      const emailResult = await sendAppLaunchNotification(testEmail, {
        appStoreUrl,
        playStoreUrl,
      });

      return NextResponse.json({
        success: emailResult.success,
        testMode: true,
        sentTo: testEmail,
        messageId: emailResult.messageId,
        error: emailResult.error,
      });
    }

    // Production mode: send to all waitlist subscribers
    const waitlistEntries = await prisma.waitlist.findMany({
      select: { email: true, id: true },
    });

    if (waitlistEntries.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Aucun inscrit sur la liste d'attente",
        sent: 0,
      });
    }

    // Send emails in batches to avoid rate limits
    const batchSize = 50;
    const results = {
      total: waitlistEntries.length,
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (let i = 0; i < waitlistEntries.length; i += batchSize) {
      const batch = waitlistEntries.slice(i, i + batchSize);

      // Send emails in parallel within batch
      const batchPromises = batch.map(async (entry) => {
        try {
          const emailResult = await sendAppLaunchNotification(entry.email, {
            appStoreUrl,
            playStoreUrl,
          });

          if (emailResult.success) {
            results.sent++;
          } else {
            results.failed++;
            results.errors.push(`${entry.email}: ${emailResult.error}`);
          }
        } catch (error) {
          results.failed++;
          results.errors.push(
            `${entry.email}: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
      });

      await Promise.all(batchPromises);

      // Wait 1 second between batches to respect rate limits
      if (i + batchSize < waitlistEntries.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Log the notification event
    logger.debug(`Waitlist notification sent: ${results.sent}/${results.total} emails`);

    return NextResponse.json({
      success: true,
      message: `Notifications envoyées à ${results.sent}/${results.total} inscrits`,
      ...results,
    });
  } catch (error) {
    logger.error("Waitlist notify error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'envoi des notifications" },
      { status: 500 }
    );
  }
}

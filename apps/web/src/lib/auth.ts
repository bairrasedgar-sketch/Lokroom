// apps/web/src/lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { prisma } from "@/lib/db";

/**
 * Options NextAuth partagées (exportées) pour:
 * - l’endpoint /api/auth/[...nextauth]
 * - les appels getServerSession(authOptions) dans tes API routes/pages
 */
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  // Tu restes en "database" comme avant
  session: { strategy: "database" },

  providers: [
    // 🔐 Connexion avec Google
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // ✉️ Connexion par e-mail (magic link avec joli template Lok'Room)
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST!,
        port: Number(process.env.EMAIL_SERVER_PORT || 587),
        auth: {
          user: process.env.EMAIL_SERVER_USER!,
          pass: process.env.EMAIL_SERVER_PASSWORD!,
        },
      },
      from: process.env.EMAIL_FROM,
      maxAge: 10 * 60, // lien valable 10 minutes

      async sendVerificationRequest({ identifier, url, provider }) {
        const { host } = new URL(url);

        const html = `
  <div style="background:#f5f5f5;padding:24px 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:24px;padding:24px 24px 28px;border:1px solid #e5e5e5;">
      <div style="text-align:center;margin-bottom:16px;">
        <div style="display:inline-flex;height:40px;width:40px;border-radius:999px;background:#111111;color:#ffffff;align-items:center;justify-content:center;font-weight:600;font-size:18px;">
          L
        </div>
        <div style="font-size:18px;font-weight:600;margin-top:8px;">Lok’Room</div>
      </div>

      <h1 style="font-size:20px;margin:0 0 8px;color:#111111;">Confirme ton adresse e-mail</h1>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.5;color:#555555;">
        Clique sur le bouton ci-dessous pour te connecter à Lok’Room et terminer ton inscription.
      </p>

      <div style="text-align:center;margin:24px 0;">
        <a href="${url}"
           style="display:inline-block;background:#111111;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:999px;font-size:14px;font-weight:600;">
          Vérifier mon e-mail
        </a>
      </div>

      <p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:#777777;">
        Si tu n’arrives pas à cliquer sur le bouton, copie-colle ce lien dans ton navigateur :
      </p>
      <p style="margin:0;font-size:11px;line-height:1.5;color:#999999;word-break:break-all;">
        ${url}
      </p>

      <p style="margin-top:20px;font-size:11px;color:#aaaaaa;">
        Ce lien est valable pendant 10 minutes et ne fonctionne que depuis ce navigateur.
        Si tu n’es pas à l’origine de cette demande, tu peux ignorer cet e-mail.
      </p>
    </div>

    <p style="margin-top:12px;text-align:center;font-size:11px;color:#aaaaaa;">
      Lok’Room · Connexions sécurisées à ${host}
    </p>
  </div>
        `;

        const text = `Connecte-toi à Lok’Room en cliquant sur ce lien : ${url}`;

        const message = {
          to: identifier,
          from: provider.from,
          subject: "Connexion à Lok’Room",
          text,
          html,
        };

        // Envoi via le SMTP configuré dans provider.server
        const nodemailer = await import("nodemailer");
        const transport = nodemailer.createTransport(provider.server as any);

        try {
          await transport.sendMail(message);
        } catch (error) {
          // log mais ne crash pas le serveur
          console.error("Erreur d’envoi d’e-mail de vérification :", error);
          throw new Error("Impossible d’envoyer l’e-mail de vérification");
        }
      },
    }),
  ],

  pages: {
    signIn: "/login",
    verifyRequest: "/login?verify=1",
  },

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },

    async session({ session }) {
      if (!session.user?.email) return session;

      const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
          id: true,
          role: true,
          hostProfile: {
            select: {
              payoutsEnabled: true,
            },
          },
        },
      });

      if (!dbUser) return session;

      (session.user as any).id = dbUser.id;
      (session.user as any).role = dbUser.role;
      (session.user as any).isHost =
        dbUser.role === "HOST" ||
        dbUser.role === "BOTH" ||
        !!dbUser.hostProfile?.payoutsEnabled;

      return session;
    },
  },

  events: {
    async signIn({ user }) {
      if (!user?.email) return;
      try {
        await prisma.user.update({
          where: { email: user.email },
          data: { lastLoginAt: new Date() },
        });
      } catch {
        // on ne casse pas le login en cas d'erreur
      }
    },
  },
};

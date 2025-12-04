// apps/web/src/lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { prisma } from "@/lib/db";
import { sendEmail, magicLinkEmail } from "@/lib/email";

/**
 * Options NextAuth partagées (exportées) pour:
 * - l'endpoint /api/auth/[...nextauth]
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

    // ✉️ Connexion par e-mail (magic link via Resend)
    EmailProvider({
      from: process.env.EMAIL_FROM,
      maxAge: 10 * 60, // lien valable 10 minutes

      async sendVerificationRequest({ identifier, url }) {
        const { html, text } = magicLinkEmail(url);

        const result = await sendEmail({
          to: identifier,
          subject: "Connexion à Lok'Room",
          html,
          text,
        });

        if (!result.success) {
          console.error("[Auth] Erreur envoi magic link:", result.error);
          throw new Error("Impossible d'envoyer l'e-mail de vérification");
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

// apps/web/src/lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import { sendEmail, magicLinkEmail } from "@/lib/email";
import { verifyPassword } from "@/lib/password";

/**
 * Options NextAuth partagées (exportées) pour:
 * - l'endpoint /api/auth/[...nextauth]
 * - les appels getServerSession(authOptions) dans tes API routes/pages
 */
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  // Changé en JWT pour supporter le Credentials provider
  session: { strategy: "jwt" },

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

    // 🔑 Connexion avec email + mot de passe
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email.trim().toLowerCase();

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            passwordHash: true,
            role: true,
            emailVerified: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await verifyPassword(credentials.password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        // Mettre à jour la dernière connexion
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name || `${user.profile?.firstName || ""} ${user.profile?.lastName || ""}`.trim() || null,
          image: user.profile?.avatarUrl || null,
          role: user.role,
        };
      },
    }),
  ],

  pages: {
    signIn: "/login",
    verifyRequest: "/login?verify=1",
  },

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async jwt({ token, user, trigger }) {
      // Première connexion : stocker l'id et le role
      if (user?.id) {
        token.sub = user.id;
        token.email = user.email;
        token.role = (user as { role?: string }).role as typeof token.role;
      }

      // Rafraîchir le role depuis la DB à chaque refresh (pour mise à jour en temps réel)
      if (trigger === "update" || !token.role) {
        const email = token.email as string | undefined;
        if (email) {
          const dbUser = await prisma.user.findUnique({
            where: { email },
            select: { role: true },
          });
          if (dbUser) {
            token.role = dbUser.role;
          }
        }
      }

      return token;
    },

    async session({ session, token }) {
      // Récupérer l'email depuis le token JWT
      const email = token.email as string | undefined;
      if (!email) return session;

      const dbUser = await prisma.user.findUnique({
        where: { email },
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

      // Extend session.user with custom fields
      const extendedUser = session.user as {
        id?: string;
        role?: string;
        isHost?: boolean;
        email?: string | null;
        name?: string | null;
        image?: string | null;
      };
      extendedUser.id = dbUser.id;
      extendedUser.role = dbUser.role;
      extendedUser.isHost =
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

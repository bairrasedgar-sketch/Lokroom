// apps/web/src/lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import { sendEmail, magicLinkEmail } from "@/lib/email";
import { verifyPassword } from "@/lib/password";
import { jwtVerify } from "jose";

// Cle pour les tokens temporaires 2FA et verification email
const AUTH_TOKEN_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "fallback-secret-key-for-2fa"
);

/**
 * Verifie un token temporaire 2FA
 */
async function verifyTwoFactorPendingToken(
  token: string
): Promise<{ userId: string; email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, AUTH_TOKEN_SECRET);

    if (payload.type !== "2fa-pending") {
      return null;
    }

    return {
      userId: payload.userId as string,
      email: payload.email as string,
    };
  } catch {
    return null;
  }
}

/**
 * Verifie un token de verification d'email (inscription)
 */
async function verifyEmailVerificationToken(
  token: string
): Promise<{ userId: string; email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, AUTH_TOKEN_SECRET);

    if (payload.type !== "email-verified") {
      return null;
    }

    return {
      userId: payload.userId as string,
      email: payload.email as string,
    };
  } catch {
    return null;
  }
}

/**
 * Options NextAuth partagées (exportées) pour:
 * - l'endpoint /api/auth/[...nextauth]
 * - les appels getServerSession(authOptions) dans tes API routes/pages
 */
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  // Changé en JWT pour supporter le Credentials provider
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },

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

    // Connexion avec email + mot de passe
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
        twoFactorVerified: { label: "2FA Verified", type: "text" },
        twoFactorToken: { label: "2FA Token", type: "text" },
        emailVerified: { label: "Email Verified", type: "text" },
        emailVerificationToken: { label: "Email Verification Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          return null;
        }

        const email = credentials.email.trim().toLowerCase();

        // Cas 0: Connexion apres verification d'email (inscription)
        if (credentials.emailVerified === "true" && credentials.emailVerificationToken) {
          const tokenPayload = await verifyEmailVerificationToken(credentials.emailVerificationToken);

          if (!tokenPayload || tokenPayload.email !== email) {
            return null;
          }

          // Recuperer l'utilisateur
          const user = await prisma.user.findUnique({
            where: { email },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                },
              },
            },
          });

          if (!user) {
            return null;
          }

          // Mettre a jour la derniere connexion
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
        }

        // Cas 1: Connexion apres verification 2FA
        if (credentials.twoFactorVerified === "true" && credentials.twoFactorToken) {
          // Verifier le token 2FA
          const tokenPayload = await verifyTwoFactorPendingToken(credentials.twoFactorToken);

          if (!tokenPayload || tokenPayload.email !== email) {
            return null;
          }

          // Recuperer l'utilisateur
          const user = await prisma.user.findUnique({
            where: { email },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                },
              },
            },
          });

          if (!user) {
            return null;
          }

          // Mettre a jour la derniere connexion
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
        }

        // Cas 2: Connexion normale avec mot de passe
        if (!credentials.password) {
          return null;
        }

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
            twoFactorSecret: {
              select: { enabled: true },
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

        // Si 2FA est active, ne pas autoriser la connexion directe
        // (le frontend doit d'abord passer par /api/auth/2fa/check)
        if (user.twoFactorSecret?.enabled) {
          // On retourne null pour forcer le passage par le flux 2FA
          // Le frontend detectera cela et redirigera vers la page 2FA
          return null;
        }

        // Mettre a jour la derniere connexion
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

      // Rafraîchir le role et onboardingCompleted depuis la DB
      if (trigger === "update" || !token.role || token.onboardingCompleted === undefined) {
        const email = token.email as string | undefined;
        if (email) {
          const dbUser = await prisma.user.findUnique({
            where: { email },
            select: {
              role: true,
              passwordHash: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          });
          if (dbUser) {
            token.role = dbUser.role;
            // Onboarding complété si l'utilisateur a un mot de passe ET un profil avec nom/prénom
            token.onboardingCompleted = !!(
              dbUser.passwordHash &&
              dbUser.profile?.firstName &&
              dbUser.profile?.lastName
            );
          }
        }
      }

      return token;
    },

    async session({ session, token }) {
      // Récupérer les données depuis le token JWT (pas de requête DB)
      const extendedUser = session.user as {
        id?: string;
        role?: string;
        isHost?: boolean;
        email?: string | null;
        name?: string | null;
        image?: string | null;
      };

      // Utiliser les données du token directement
      extendedUser.id = token.sub as string;
      extendedUser.role = token.role as string;

      // Stocker isHost dans le token pour éviter les requêtes DB
      if (token.isHost !== undefined) {
        extendedUser.isHost = token.isHost as boolean;
      } else {
        // Première fois : récupérer depuis la DB et stocker dans le token
        const email = token.email as string | undefined;
        if (email) {
          const dbUser = await prisma.user.findUnique({
            where: { email },
            select: {
              role: true,
              hostProfile: {
                select: {
                  payoutsEnabled: true,
                },
              },
              _count: {
                select: {
                  Listing: true,
                },
              },
            },
          });

          if (dbUser) {
            const isHost =
              dbUser.role === "HOST" ||
              dbUser.role === "BOTH" ||
              !!dbUser.hostProfile?.payoutsEnabled ||
              dbUser._count.Listing > 0;

            extendedUser.isHost = isHost;
            token.isHost = isHost; // Stocker pour les prochaines fois
          }
        }
      }

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

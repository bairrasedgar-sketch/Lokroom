import NextAuth from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import EmailProvider from "next-auth/providers/email";
import { prisma } from "@/lib/db";

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  providers: [
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
    }),
  ],
  pages: {
    signIn: "/login",
    verifyRequest: "/login?verify=1",
  },
  secret: process.env.NEXTAUTH_SECRET,

  // ✅ Bloc complet des callbacks : ajoute l’id de l’utilisateur à la session
  callbacks: {
    async jwt({ token, user }) {
      // Si c’est la première connexion : stocke l’id dans le token
      if (user && user.id) {
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Expose l’id de l’utilisateur côté client (session.user.id)
      if (session.user && token?.sub) {
        (session.user as any).id = token.sub;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
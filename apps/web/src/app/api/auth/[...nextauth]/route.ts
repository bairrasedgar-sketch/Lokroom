import NextAuth from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import EmailProvider from "next-auth/providers/email"
import nodemailer from "nodemailer"
import { prisma } from "@/lib/db"

async function getTransporter() {
  const host = process.env.EMAIL_SERVER_HOST
  const port = process.env.EMAIL_SERVER_PORT ? Number(process.env.EMAIL_SERVER_PORT) : undefined
  const user = process.env.EMAIL_SERVER_USER
  const pass = process.env.EMAIL_SERVER_PASSWORD

  if (host && port && user && pass) {
    return nodemailer.createTransport({ host, port, auth: { user, pass } })
  }
  const test = await nodemailer.createTestAccount()
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    auth: { user: test.user, pass: test.pass }
  })
}

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  providers: [
    EmailProvider({
      async sendVerificationRequest({ identifier, url }) {
        const transport = await getTransporter()
        const info = await transport.sendMail({
          to: identifier,
          from: process.env.EMAIL_FROM || "Lokroom <no-reply@localhost>",
          subject: "Your Lokroom sign-in link",
          text: `Click the link to sign in: ${url}`,
          html: `<p>Click the link to sign in:</p><p><a href="${url}">${url}</a></p>`,
        })
        const preview = nodemailer.getTestMessageUrl(info)
        if (preview) console.log("📧 Email preview (Ethereal):", preview)
      },
    }),
  ],
  pages: {
    signIn: "/login",
    verifyRequest: "/login?verify=1",
  },
  secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }
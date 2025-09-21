import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role?: "HOST" | "GUEST" | "BOTH"
      country?: string | null
    } & DefaultSession["user"]
  }
}

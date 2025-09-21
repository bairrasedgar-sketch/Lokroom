import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { authOptions } from "@/lib/auth"

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  async function action(formData: FormData) {
    "use server"
    if (!user) return
    const name = String(formData.get("name") || "")
    const country = String(formData.get("country") || "")
    await prisma.user.update({
      where: { id: user.id },
      data: { name, country }
    })
  }

  return (
    <section className="max-w-xl mx-auto space-y-4">
      <h2 className="text-2xl font-semibold">My Profile</h2>
      <p className="text-sm text-gray-600">Email: {session.user?.email}</p>

      <form action={action} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Name</label>
          <input name="name" defaultValue={user?.name || ""} className="w-full rounded-md border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">Country</label>
          <input name="country" defaultValue={user?.country || ""} className="w-full rounded-md border px-3 py-2" />
        </div>
        <button className="rounded-md bg-black text-white px-4 py-2 text-sm">Save</button>
      </form>
    </section>
  )
}
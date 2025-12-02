// apps/web/src/app/onboarding/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import OnboardingForm from "./onboarding-form";

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);

  // Pas connecté → on renvoie vers la connexion par e-mail
  if (!session?.user?.email) {
    redirect("/login");
  }

  const email = session.user!.email as string;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-lg p-6">
        <h1 className="text-xl font-semibold mb-1">
          Termine ton inscription
        </h1>
        <p className="text-sm text-gray-500 mb-4">
          Quelques infos pour personnaliser ton compte Lok’Room.
        </p>

        <OnboardingForm email={email} />
      </div>
    </div>
  );
}

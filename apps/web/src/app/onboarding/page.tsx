import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServerDictionary } from "@/lib/i18n.server";
import { prisma } from "@/lib/db";
import OnboardingForm from "./onboarding-form";

// Types pour les données utilisateur
type UserData = {
  firstName: string;
  lastName: string;
  role: "guest" | "host" | null;
  birthDate: string;
  phone: string;
  addressLine1: string;
  city: string;
  postalCode: string;
  country: string;
  identityStatus: string;
  hasStripeConnect: boolean;
  payoutsEnabled: boolean;
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: { identity?: string; connect?: string };
}) {
  const session = await getServerSession(authOptions);

  // Pas connecté → on renvoie vers la connexion par e-mail
  if (!session?.user?.email) {
    redirect("/login");
  }

  const email = session.user!.email as string;
  const { dict } = getServerDictionary();
  const t = dict.onboarding;

  // Récupérer les données existantes de l'utilisateur
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      role: true,
      identityStatus: true,
      profile: {
        select: {
          firstName: true,
          lastName: true,
          birthDate: true,
          phone: true,
          addressLine1: true,
          city: true,
          postalCode: true,
          country: true,
        },
      },
      hostProfile: {
        select: {
          stripeAccountId: true,
          payoutsEnabled: true,
        },
      },
    },
  });

  // Préparer les données initiales pour le formulaire
  const initialData: UserData = {
    firstName: user?.profile?.firstName || "",
    lastName: user?.profile?.lastName || "",
    role: user?.role === "HOST" ? "host" : user?.role === "GUEST" ? "guest" : null,
    birthDate: user?.profile?.birthDate
      ? new Date(user.profile.birthDate).toISOString().split("T")[0]
      : "",
    phone: user?.profile?.phone || "",
    addressLine1: user?.profile?.addressLine1 || "",
    city: user?.profile?.city || "",
    postalCode: user?.profile?.postalCode || "",
    country: user?.profile?.country || "",
    identityStatus: user?.identityStatus || "UNVERIFIED",
    hasStripeConnect: !!user?.hostProfile?.stripeAccountId,
    payoutsEnabled: user?.hostProfile?.payoutsEnabled || false,
  };

  // Déterminer si on revient de Stripe
  const returnFromStripe = searchParams.identity === "complete" || searchParams.connect === "complete";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-lg p-6">
        <h1 className="text-xl font-semibold mb-1">
          {t.title}
        </h1>
        <p className="text-sm text-gray-500 mb-4">
          {t.subtitle}
        </p>

        <OnboardingForm
          email={email}
          initialData={initialData}
          returnFromStripe={returnFromStripe}
        />
      </div>
    </div>
  );
}

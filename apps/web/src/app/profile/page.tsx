"use client";

import { useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import Image from "next/image";
import { toast } from "sonner";

type Role = "HOST" | "GUEST" | "BOTH";

type UserProfileDTO = {
  avatarUrl?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  birthDate?: string | null; // ISO
  phone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
  province?: string | null;
  ratingAvg?: number | null;
  ratingCount?: number | null;

  // Champs "infos sur moi" Airbnb-style (facultatifs, backend plus tard)
  jobTitle?: string | null;
  dreamDestination?: string | null;
  languages?: string | null;
  aboutMe?: string | null;
  interests?: string | null;
};

type UserDTO = {
  id?: string;
  email: string | null;
  name: string | null;
  country: string | null;
  role: Role | null;
  createdAt?: string | null;
  profile?: UserProfileDTO | null;
};

type BookingListingDTO = {
  id: string;
  title: string;
  city?: string | null;
  country?: string | null;
  coverImageUrl?: string | null;
};

type BookingDTO = {
  id: string;
  startDate: string;
  endDate: string;
  listing: BookingListingDTO;
};

type Tab = "about" | "trips";

export default function ProfilePage() {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [initial, setInitial] = useState<UserDTO | null>(null);
  const [role, setRole] = useState<Role>("GUEST");

  // pour l’édition simple (nom + pays)
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");

  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  // avatar
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarStatus, setAvatarStatus] = useState<
    "idle" | "presigning" | "uploading" | "saving" | "done" | "error"
  >("idle");

  // voyages précédents
  const [tab, setTab] = useState<Tab>("about");
  const [trips, setTrips] = useState<BookingDTO[]>([]);
  const [tripsLoading, setTripsLoading] = useState(true);

  // ouverture depuis un bouton externe
  const [profileEditRequested, setProfileEditRequested] = useState(false);

  // 1️⃣ Chargement du profil
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/profile", { cache: "no-store" });
        if (!res.ok) return;
        const { user } = (await res.json()) as { user: UserDTO };
        setUser(user);
        setInitial(user);
        setName(user?.name ?? "");
        setCountry(user?.country ?? "");
        setRole((user?.role as Role) ?? "GUEST");
        if (user?.profile?.avatarUrl) {
          setAvatarPreview(user.profile.avatarUrl);
        }
      } catch {
        // silencieux
      }
    })();
  }, []);

  // 2️⃣ Chargement des voyages précédents
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/account/trips", { cache: "no-store" });
        if (!res.ok) {
          setTrips([]);
          return;
        }
        const data = (await res.json()) as { trips?: BookingDTO[] };
        setTrips(data.trips ?? []);
      } catch {
        setTrips([]);
      } finally {
        setTripsLoading(false);
      }
    })();
  }, []);

  const changed = useMemo(() => {
    if (!initial) return false;
    return (
      (initial.name ?? "") !== name ||
      (initial.country ?? "") !== country ||
      ((initial.role ?? "GUEST") as Role) !== role
    );
  }, [initial, name, country, role]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!changed) return;

    setSaving(true);
    setStatus("idle");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, country, role }),
      });
      if (!res.ok) throw new Error("Save failed");

      setInitial((prev) =>
        prev
          ? { ...prev, name, country, role }
          : { email: user?.email ?? "", name, country, role }
      );
      setUser((prev) => (prev ? { ...prev, name, country, role } : prev));
      setStatus("saved");
      toast.success("Profil sauvegardé ✅");
    } catch {
      setStatus("error");
      toast.error("Erreur lors de la sauvegarde du profil");
    } finally {
      setSaving(false);
      setTimeout(() => setStatus("idle"), 2000);
    }
  }

  function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.currentTarget.files?.[0] || null;
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("Image uniquement");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error("Image trop lourde (max 5 MB)");
      return;
    }
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
  }

  async function onUploadAvatar() {
    if (!avatarFile) return;
    try {
      setAvatarStatus("presigning");
      const presign = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: avatarFile.name,
          contentType: avatarFile.type,
        }),
      }).then((r) => r.json());

      if (!presign?.uploadUrl) throw new Error("presign failed");

      setAvatarStatus("uploading");
      const put = await fetch(presign.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": avatarFile.type },
        body: avatarFile,
      });
      if (!put.ok) throw new Error("upload failed");

      setAvatarStatus("saving");
      const save = await fetch("/api/profile/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: presign.publicUrl }),
      });
      if (!save.ok) throw new Error("save failed");

      setAvatarStatus("done");
      setAvatarPreview(presign.publicUrl);
      setUser((prev) =>
        prev
          ? {
              ...prev,
              profile: { ...(prev.profile ?? {}), avatarUrl: presign.publicUrl },
            }
          : prev
      );
      toast.success("Avatar mis à jour ✅");
    } catch (e) {
      console.error(e);
      setAvatarStatus("error");
      toast.error("Échec de l’upload de l’avatar");
    }
  }

  async function onDeleteAvatar() {
    try {
      const res = await fetch("/api/profile/avatar", { method: "DELETE" });
      if (res.ok) {
        setAvatarFile(null);
        setAvatarPreview(null);
        setUser((prev) =>
          prev
            ? { ...prev, profile: { ...(prev.profile ?? {}), avatarUrl: null } }
            : prev
        );
        toast.success("Avatar supprimé ✅");
      } else {
        toast.error("Impossible de supprimer l’avatar");
      }
    } catch {
      toast.error("Impossible de supprimer l’avatar");
    }
  }

  const fullName = useMemo(() => {
    const p = user?.profile;
    if (p?.firstName || p?.lastName) {
      return `${p?.firstName ?? ""} ${p?.lastName ?? ""}`.trim();
    }
    return user?.name ?? user?.email ?? "Utilisateur Lok'Room";
  }, [user]);

  const cityLine = useMemo(() => {
    const p = user?.profile;
    if (p?.city || p?.country) {
      return `${p?.city ?? ""}${
        p?.city && p?.country ? ", " : ""
      }${p?.country ?? ""}`;
    }
    return "Complète ton profil";
  }, [user]);

  const memberSinceYear = useMemo(() => {
    if (!user?.createdAt) return null;
    const d = new Date(user.createdAt);
    if (Number.isNaN(d.getTime())) return null;
    return d.getFullYear();
  }, [user]);

  const tripsCount = trips.length;

  return (
    <main className="mx-auto max-w-6xl px-4 pb-12 pt-10">
      {/* Layout principal */}
      <div className="flex gap-10">
        {/* Colonne gauche – menu comme Airbnb */}
        <aside className="w-64 shrink-0">
          <h1 className="mb-6 text-2xl font-semibold">Profil</h1>

          <nav className="space-y-2 text-sm">
            <button
              type="button"
              onClick={() => setTab("about")}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left ${
                tab === "about"
                  ? "bg-black text-white"
                  : "text-gray-800 hover:bg-gray-100"
              }`}
            >
              <div className="relative h-10 w-10 overflow-hidden rounded-full bg-gray-200">
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarPreview}
                    alt={fullName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-xs font-medium text-gray-600">
                    {fullName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide opacity-70">
                  À propos de moi
                </div>
                <div className="text-sm font-medium">{fullName}</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTab("trips")}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left ${
                tab === "trips"
                  ? "bg-black text-white"
                  : "text-gray-800 hover:bg-gray-100"
              }`}
            >
              <span className="text-sm font-medium">Voyages précédents</span>
            </button>
          </nav>
        </aside>

        {/* Colonne droite – contenu principal */}
        <section className="flex-1 space-y-8">
          {tab === "about" ? (
            <AboutSection
              email={user?.email ?? ""}
              fullName={fullName}
              cityLine={cityLine}
              memberSinceYear={memberSinceYear}
              profile={user?.profile ?? null}
              tripsCount={tripsCount}
              avatarPreview={avatarPreview}
              onPickAvatar={onPickAvatar}
              onUploadAvatar={onUploadAvatar}
              onDeleteAvatar={onDeleteAvatar}
              avatarFile={avatarFile}
              avatarStatus={avatarStatus}
              name={name}
              country={country}
              role={role}
              setName={setName}
              setCountry={setCountry}
              setRole={setRole}
              onSave={onSave}
              saving={saving}
              changed={changed}
              status={status}
              profileEditRequested={profileEditRequested}
              onConsumeProfileEdit={() => setProfileEditRequested(false)}
            />
          ) : (
            <TripsSection trips={trips} loading={tripsLoading} />
          )}
        </section>
      </div>
    </main>
  );
}

/* ===========================
   Section "À propos de moi"
   =========================== */

type AboutAvatarStatus =
  | "idle"
  | "presigning"
  | "uploading"
  | "saving"
  | "done"
  | "error";

type AboutProps = {
  email: string;
  fullName: string;
  cityLine: string;
  memberSinceYear: number | null;
  profile: UserProfileDTO | null;
  tripsCount: number;
  avatarPreview: string | null;
  avatarFile: File | null;
  avatarStatus: AboutAvatarStatus;
  onPickAvatar: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUploadAvatar: () => Promise<void>;
  onDeleteAvatar: () => Promise<void> | void;
  name: string;
  country: string;
  role: Role;
  setName: Dispatch<SetStateAction<string>>;
  setCountry: Dispatch<SetStateAction<string>>;
  setRole: Dispatch<SetStateAction<Role>>;
  onSave: (e: React.FormEvent) => void;
  saving: boolean;
  changed: boolean;
  status: "idle" | "saved" | "error";
  profileEditRequested: boolean;
  onConsumeProfileEdit: () => void;
};

function AboutSection(props: AboutProps) {
  const {
    email,
    fullName,
    cityLine,
    memberSinceYear,
    profile,
    tripsCount,
    avatarPreview,
    avatarFile,
    avatarStatus,
    onPickAvatar,
    onUploadAvatar,
    onDeleteAvatar,
    name,
    country,
    role,
    setName,
    setCountry,
    setRole,
    onSave,
    saving,
    changed,
    status,
    profileEditRequested,
    onConsumeProfileEdit,
  } = props;

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPublic, setIsEditingPublic] = useState(false);

  // scroll lock quand une des deux bulles est ouverte
  useEffect(() => {
    if (!isEditingProfile && !isEditingPublic) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isEditingProfile, isEditingPublic]);

  // ouverture depuis un bouton externe
  useEffect(() => {
    if (!profileEditRequested) return;
    setIsEditingProfile(true);
    onConsumeProfileEdit();
  }, [profileEditRequested, onConsumeProfileEdit]);

  const reviewsCount = profile?.ratingCount ?? 0;
  const rating =
    typeof profile?.ratingAvg === "number"
      ? profile.ratingAvg.toFixed(1)
      : "–";

  // états locaux pour les infos publiques
  const [publicJobTitle, setPublicJobTitle] = useState(profile?.jobTitle ?? "");
  const [publicDreamDestination, setPublicDreamDestination] = useState(
    profile?.dreamDestination ?? ""
  );
  const [publicLanguages, setPublicLanguages] = useState(
    profile?.languages ?? ""
  );
  const [publicAboutMe, setPublicAboutMe] = useState(profile?.aboutMe ?? "");
  const [publicInterests, setPublicInterests] = useState(
    profile?.interests ?? ""
  );

  useEffect(() => {
    setPublicJobTitle(profile?.jobTitle ?? "");
    setPublicDreamDestination(profile?.dreamDestination ?? "");
    setPublicLanguages(profile?.languages ?? "");
    setPublicAboutMe(profile?.aboutMe ?? "");
    setPublicInterests(profile?.interests ?? "");
  }, [profile]);

  const jobTitle =
    publicJobTitle || "Ajoute ton travail dans ton profil Lok’Room";
  const dreamDestination =
    publicDreamDestination || "Ajoute ta destination de rêve";
  const languages = publicLanguages || "Ajoute les langues que tu parles";
  const aboutMe =
    publicAboutMe ||
    "Écris quelques lignes sur toi pour inspirer confiance aux hôtes.";
  const interests =
    publicInterests || "Ajoute tes centres d’intérêt principaux.";

  // ⚙️ Infos compte
  const legalName =
    (profile?.firstName || profile?.lastName
      ? `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim()
      : fullName) || "Non fourni";

  const chosenName = name || "Non fourni";
  const phone = profile?.phone ?? "Non fourni";
  const accountVerificationNumber = "Non fourni";
  const identityStatus = "Vérifiée"; // placeholder

  const residentialAddress =
    profile?.addressLine1 || profile?.city || profile?.postalCode
      ? `${profile?.addressLine1 ?? ""}${
          profile?.addressLine1 ? ", " : ""
        }${profile?.postalCode ?? ""} ${profile?.city ?? ""}`.trim()
      : "Non fourni";

  const postalAddress =
    residentialAddress !== "Non fourni" ? "Fournie" : "Non fournie";

  const emergencyContact = "Non fourni";

  function handleSoon() {
    toast.info("Bientôt tu pourras modifier cette info ici 🔧");
  }

  // sauvegarde des infos publiques (pour l’instant uniquement front)
  const [savingPublic, setSavingPublic] = useState(false);
  async function onSavePublic(e: React.FormEvent) {
    e.preventDefault();
    setSavingPublic(true);
    try {
      // TODO: brancher au backend plus tard (PATCH /api/profile avec les champs de profil)
      toast.success(
        "Infos publiques mises à jour (sauvegarde serveur à brancher) ✅"
      );
      setIsEditingPublic(false);
    } catch {
      toast.error("Impossible de mettre à jour les infos publiques");
    } finally {
      setSavingPublic(false);
    }
  }

  return (
    <>
      {/* Titre seul */}
      <div className="mb-4">
        <h2 className="text-2xl font-semibold">À propos de moi</h2>
      </div>

      {/* Carte principale profil + stats + bouton Modifier le profil */}
      <section className="flex flex-col gap-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-6">
          <div className="relative h-20 w-20 overflow-hidden rounded-full bg-gray-200">
            {avatarPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarPreview}
                alt={fullName}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-2xl font-semibold text-gray-600">
                {fullName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Profil Lok&apos;Room
            </p>
            <h3 className="text-xl font-semibold">{fullName}</h3>
            <p className="text-sm text-gray-500">{cityLine}</p>
            <p className="text-xs text-gray-400">
              Membre Lok&apos;Room
              {memberSinceYear ? ` depuis ${memberSinceYear}` : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-4 text-sm">
          {/* Bulle 1 : Modifier le profil */}
          <button
            type="button"
            onClick={() => setIsEditingProfile(true)}
            className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium hover:border-black hover:text-black"
          >
            Modifier le profil
          </button>

          <div className="flex gap-10 text-center">
            <div>
              <div className="text-lg font-semibold">{tripsCount}</div>
              <div className="text-gray-500">Voyages</div>
            </div>
            <div>
              <div className="text-lg font-semibold">{reviewsCount}</div>
              <div className="text-gray-500">Commentaires</div>
            </div>
            <div>
              <div className="text-lg font-semibold">{rating}</div>
              <div className="text-gray-500">Note moyenne</div>
            </div>
          </div>
        </div>
      </section>

      {/* Colonne d’infos "sur moi" avec icônes propres */}
      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 text-sm md:grid-cols-2">
          <div className="space-y-3">
            {/* Travail */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
                {/* Briefcase */}
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <rect
                    x="4"
                    y="8"
                    width="16"
                    height="10"
                    rx="2"
                    ry="2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M9 8V7a3 3 0 0 1 3-3h0a3 3 0 0 1 3 3v1"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M4 12h16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                </svg>
              </div>
              <p>
                <span className="font-medium">Mon travail :</span>{" "}
                <span className="text-gray-700">{jobTitle}</span>
              </p>
            </div>

            {/* Destination de rêve */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
                {/* Globe / avion */}
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M9 10.5 16.5 7l-2 5.5L9 10.5Zm2.5 2.5-1 4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p>
                <span className="font-medium">Ma destination de rêve :</span>{" "}
                <span className="text-gray-700">{dreamDestination}</span>
              </p>
            </div>

            {/* Langues */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
                {/* Bulle de discussion */}
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path
                    d="M5 6h14a2 2 0 0 1 2 2v5.5a2 2 0 0 1-2 2H11l-3.5 3-0.5-3H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 11h8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M8 8.5h4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <p>
                <span className="font-medium">Langues :</span>{" "}
                <span className="text-gray-700">{languages}</span>
              </p>
            </div>

            {/* Identité vérifiée */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
                {/* Bouclier */}
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path
                    d="M12 4 6 6v6c0 3.5 2.3 5.7 6 8 3.7-2.3 6-4.5 6-8V6l-6-2Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                  <path
                    d="m9.5 12.5 1.7 1.7 3.3-3.4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p>
                <span className="font-medium">Identité vérifiée :</span>{" "}
                <span className="text-gray-700">
                  {profile ? "Bientôt (via KYC Stripe)" : "Non renseigné"}
                </span>
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="mb-1 text-sm font-medium">À propos de moi</p>
              <p className="text-gray-700">{aboutMe}</p>
            </div>
            <div>
              <p className="mb-1 text-sm font-medium">Centres d’intérêt</p>
              <p className="text-gray-700">{interests}</p>
            </div>
          </div>
        </div>

        {/* Bulle 2 : Modifier mes infos publiques en bas à droite */}
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => setIsEditingPublic(true)}
            className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium hover:border-black hover:text-black"
          >
            Modifier mes infos publiques
          </button>
        </div>
      </section>

      {/* Bloc "Commentaires sur moi" */}
      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-2 text-base font-semibold">Commentaires sur moi</h3>
        <p className="text-sm text-gray-600">
          Quand tu auras effectué des réservations sur Lok&apos;Room, les hôtes
          pourront laisser des commentaires sur toi. Ils apparaîtront ici, un
          peu comme sur Airbnb (photo de l&apos;hôte, date, texte, etc.).
        </p>
      </section>

      {/* 🔥 MODAL PROFIL (avatar + nom + pays + infos compte) */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          {/* Backdrop flouté */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsEditingProfile(false)}
          />

          {/* Bulle d’édition (scroll uniquement ici) */}
          <section
            className="relative z-50 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold">
                Photo de profil & informations
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="text-sm text-gray-500 hover:text-black"
              >
                Fermer
              </button>
            </div>

            {/* Avatar + input fichier custom */}
            <div className="mb-4 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <div className="relative h-16 w-16 overflow-hidden rounded-full bg-gray-200">
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarPreview}
                    alt="avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-sm text-gray-600">
                    {email?.[0]?.toUpperCase() ?? "?"}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2 text-sm">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="cursor-pointer rounded-full border border-gray-300 px-4 py-2 text-xs font-medium text-gray-800 hover:border-black hover:bg-gray-50 sm:text-sm">
                    Choisir un fichier
                    <input
                      type="file"
                      accept="image/*"
                      onChange={onPickAvatar}
                      className="hidden"
                    />
                  </label>
                  <span className="max-w-[200px] truncate text-xs text-gray-500 sm:max-w-xs">
                    {avatarFile?.name ?? "Aucun fichier choisi"}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onUploadAvatar}
                    disabled={
                      !avatarFile ||
                      avatarStatus === "presigning" ||
                      avatarStatus === "uploading" ||
                      avatarStatus === "saving"
                    }
                    className="rounded-full bg-black px-4 py-2 text-xs font-medium text-white disabled:opacity-50 sm:text-sm"
                  >
                    {avatarStatus === "presigning"
                      ? "Préparation…"
                      : avatarStatus === "uploading"
                      ? "Upload…"
                      : avatarStatus === "saving"
                      ? "Enregistrement…"
                      : "Uploader l’avatar"}
                  </button>

                  <button
                    type="button"
                    onClick={onDeleteAvatar}
                    className="rounded-full border border-gray-300 px-4 py-2 text-xs font-medium sm:text-sm"
                  >
                    Supprimer l’avatar
                  </button>
                </div>
              </div>
            </div>

            {/* Email */}
            <p className="mb-4 text-xs text-gray-500">
              Email : <span className="font-mono">{email}</span>
            </p>

            {/* Formulaire profil simplifié */}
            <form onSubmit={onSave} className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">
                  Nom affiché
                </label>
                <input
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                  value={name}
                  onChange={(e) => setName(e.currentTarget.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Pays</label>
                <input
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                  value={country}
                  onChange={(e) => setCountry(e.currentTarget.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Rôle</label>
                <select
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                  value={role}
                  onChange={(e) => setRole(e.currentTarget.value as Role)}
                >
                  <option value="GUEST">Voyageur</option>
                  <option value="HOST">Hôte</option>
                  <option value="BOTH">Les deux</option>
                </select>
              </div>

              <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={saving || !changed}
                  className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {saving ? "Enregistrement…" : "Enregistrer"}
                </button>

                {status === "saved" && (
                  <span className="text-sm text-green-700">Sauvegardé ✓</span>
                )}
                {status === "error" && (
                  <span className="text-sm text-red-600">
                    Erreur lors de l&apos;enregistrement
                  </span>
                )}
              </div>
            </form>

            {/* Ligne de séparation */}
            <hr className="my-6" />

            {/* Infos du compte dans la bulle */}
            <h3 className="mb-4 text-base font-semibold">
              Informations du compte
            </h3>

            <div className="divide-y divide-gray-100 text-sm">
              {/* Nom légal */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">
                    Nom légal
                  </p>
                  <p className="font-medium text-gray-800">{legalName}</p>
                </div>
                <button
                  type="button"
                  onClick={handleSoon}
                  className="text-sm font-medium text-gray-700 hover:underline"
                >
                  Modifier
                </button>
              </div>

              {/* Nom choisi */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">
                    Nom choisi
                  </p>
                  <p className="font-medium text-gray-800">
                    {chosenName === "Non fourni" ? "Non fourni" : chosenName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSoon}
                  className="text-sm font-medium text-gray-700 hover:underline"
                >
                  {chosenName === "Non fourni" ? "Ajouter" : "Modifier"}
                </button>
              </div>

              {/* Adresse courriel */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">
                    Adresse courriel
                  </p>
                  <p className="font-mono text-gray-800">{email}</p>
                </div>
                <button
                  type="button"
                  onClick={handleSoon}
                  className="text-sm font-medium text-gray-700 hover:underline"
                >
                  Modifier
                </button>
              </div>

              {/* Numéro de téléphone */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">
                    Numéro de téléphone
                  </p>
                  <p className="text-gray-800">{phone}</p>
                </div>
                <button
                  type="button"
                  onClick={handleSoon}
                  className="text-sm font-medium text-gray-700 hover:underline"
                >
                  {phone === "Non fourni" ? "Ajouter" : "Modifier"}
                </button>
              </div>

              {/* Numéro de vérification du compte */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">
                    Numéro de vérification du compte
                  </p>
                  <p className="text-gray-800">{accountVerificationNumber}</p>
                </div>
                <button
                  type="button"
                  onClick={handleSoon}
                  className="text-sm font-medium text-gray-700 hover:underline"
                >
                  Modifier
                </button>
              </div>

              {/* Vérification identité */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">
                    Vérification de l&apos;identité
                  </p>
                  <p className="text-gray-800">{identityStatus}</p>
                </div>
                <button
                  type="button"
                  onClick={handleSoon}
                  className="text-sm font-medium text-gray-700 hover:underline"
                >
                  Modifier
                </button>
              </div>

              {/* Adresse résidentielle */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">
                    Adresse résidentielle
                  </p>
                  <p className="text-gray-800">{residentialAddress}</p>
                </div>
                <button
                  type="button"
                  onClick={handleSoon}
                  className="text-sm font-medium text-gray-700 hover:underline"
                >
                  {residentialAddress === "Non fourni"
                    ? "Ajouter"
                    : "Modifier"}
                </button>
              </div>

              {/* Adresse postale */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">
                    Adresse postale
                  </p>
                  <p className="text-gray-800">{postalAddress}</p>
                </div>
                <button
                  type="button"
                  onClick={handleSoon}
                  className="text-sm font-medium text-gray-700 hover:underline"
                >
                  {postalAddress === "Non fournie" ? "Ajouter" : "Modifier"}
                </button>
              </div>

              {/* Contact d’urgence */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">
                    Contact en cas d&apos;urgence
                  </p>
                  <p className="text-gray-800">{emergencyContact}</p>
                </div>
                <button
                  type="button"
                  onClick={handleSoon}
                  className="text-sm font-medium text-gray-700 hover:underline"
                >
                  {emergencyContact === "Non fourni" ? "Ajouter" : "Modifier"}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* 🔥 MODAL INFOS PUBLIQUES (travail, langues, description, centres d’intérêt) */}
      {isEditingPublic && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsEditingPublic(false)}
          />
          <section
            className="relative z-50 max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold">
                Modifier mes infos publiques
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingPublic(false)}
                className="text-sm text-gray-500 hover:text-black"
              >
                Fermer
              </button>
            </div>

            <form className="space-y-4 text-sm" onSubmit={onSavePublic}>
              <div>
                <label className="mb-1 block font-medium">Mon travail</label>
                <input
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none"
                  value={publicJobTitle}
                  onChange={(e) => setPublicJobTitle(e.currentTarget.value)}
                  placeholder="Ex : Étudiant en droit"
                />
              </div>

              <div>
                <label className="mb-1 block font-medium">
                  Ma destination de rêve
                </label>
                <input
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none"
                  value={publicDreamDestination}
                  onChange={(e) =>
                    setPublicDreamDestination(e.currentTarget.value)
                  }
                  placeholder="Ex : Zanzibar"
                />
              </div>

              <div>
                <label className="mb-1 block font-medium">Langues parlées</label>
                <input
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none"
                  value={publicLanguages}
                  onChange={(e) => setPublicLanguages(e.currentTarget.value)}
                  placeholder="Ex : Français, anglais"
                />
              </div>

              <div>
                <label className="mb-1 block font-medium">À propos de moi</label>
                <textarea
                  className="min-h-[80px] w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none"
                  value={publicAboutMe}
                  onChange={(e) => setPublicAboutMe(e.currentTarget.value)}
                  placeholder="Écris quelques lignes sur toi…"
                />
              </div>

              <div>
                <label className="mb-1 block font-medium">
                  Centres d&apos;intérêt
                </label>
                <textarea
                  className="min-h-[60px] w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none"
                  value={publicInterests}
                  onChange={(e) => setPublicInterests(e.currentTarget.value)}
                  placeholder="Ex : voyage, sport, photographie…"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={savingPublic}
                  className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {savingPublic ? "Enregistrement…" : "Enregistrer"}
                </button>
                <p className="text-xs text-gray-500">
                  Ces infos sont visibles sur ton profil public Lok&apos;Room.
                </p>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}

/* ===========================
   Section "Voyages précédents"
   =========================== */

function TripsSection({
  trips,
  loading,
}: {
  trips: BookingDTO[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <section className="rounded-3xl border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">
        Chargement de tes voyages…
      </section>
    );
  }

  if (!trips.length) {
    return (
      <section className="rounded-3xl border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">
        <h3 className="mb-2 text-base font-semibold">Voyages précédents</h3>
        <p>
          Tu n&apos;as pas encore de réservation sur Lok&apos;Room. Dès que tu
          auras voyagé, tes séjours s&apos;afficheront ici comme sur Airbnb.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h3 className="text-base font-semibold">Voyages précédents</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {trips.map((booking) => (
          <article
            key={booking.id}
            className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
          >
            {booking.listing.coverImageUrl && (
              <div className="relative h-40 w-full">
                <Image
                  src={booking.listing.coverImageUrl}
                  alt={booking.listing.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="space-y-1 p-4 text-sm">
              <div className="font-medium">{booking.listing.title}</div>
              <div className="text-gray-500">
                {new Date(booking.startDate).toLocaleDateString()} –{" "}
                {new Date(booking.endDate).toLocaleDateString()}
              </div>
              <div className="text-gray-500">
                {booking.listing.city}
                {booking.listing.city && booking.listing.country ? ", " : ""}{" "}
                {booking.listing.country}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

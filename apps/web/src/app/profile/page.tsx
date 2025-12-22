"use client";

import { useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import Image from "next/image";
import { toast } from "sonner";
import useTranslation from "@/hooks/useTranslation";


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

type ProfileTranslations = typeof import("@/locales/fr").default.profile;

export default function ProfilePage() {
  const { dict, locale } = useTranslation();
  const t = dict.profile;

  const [user, setUser] = useState<UserDTO | null>(null);
  const [initial, setInitial] = useState<UserDTO | null>(null);
  const [role, setRole] = useState<Role>("GUEST");
  const [loading, setLoading] = useState(true);

  // pour l'édition simple (nom + pays)
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");

  // champs "légaux" / adresse
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [profileCountry, setProfileCountry] = useState("");
  const [province, setProvince] = useState("");

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
        if (!res.ok) {
          setLoading(false);
          return;
        }
        const { user } = (await res.json()) as { user: UserDTO };
        setUser(user);
        setInitial(user);
        setName(user?.name ?? "");
        setCountry(user?.country ?? "");
        setRole((user?.role as Role) ?? "GUEST");

        // champs légaux / adresse
        setFirstName(user?.profile?.firstName ?? "");
        setLastName(user?.profile?.lastName ?? "");
        setPhone(user?.profile?.phone ?? "");
        setAddressLine1(user?.profile?.addressLine1 ?? "");
        setAddressLine2(user?.profile?.addressLine2 ?? "");
        setCity(user?.profile?.city ?? "");
        setPostalCode(user?.profile?.postalCode ?? "");
        setProfileCountry(user?.profile?.country ?? "");
        setProvince(user?.profile?.province ?? "");

        if (user?.profile?.avatarUrl) {
          setAvatarPreview(user.profile.avatarUrl);
        }
      } catch {
        // silencieux
      } finally {
        setLoading(false);
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
      ((initial.role ?? "GUEST") as Role) !== role ||
      (initial.profile?.firstName ?? "") !== firstName ||
      (initial.profile?.lastName ?? "") !== lastName ||
      (initial.profile?.phone ?? "") !== phone ||
      (initial.profile?.addressLine1 ?? "") !== addressLine1 ||
      (initial.profile?.addressLine2 ?? "") !== addressLine2 ||
      (initial.profile?.city ?? "") !== city ||
      (initial.profile?.postalCode ?? "") !== postalCode ||
      (initial.profile?.country ?? "") !== profileCountry ||
      (initial.profile?.province ?? "") !== province
    );
  }, [
    initial,
    name,
    country,
    role,
    firstName,
    lastName,
    phone,
    addressLine1,
    addressLine2,
    city,
    postalCode,
    profileCountry,
    province,
  ]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!changed) return;

    setSaving(true);
    setStatus("idle");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          country,
          role,
          firstName,
          lastName,
          phone,
          addressLine1,
          addressLine2,
          city,
          postalCode,
          profileCountry,
          province,
        }),
      });
      if (!res.ok) throw new Error("Save failed");

      // on met à jour le cache local
      setInitial((prev) =>
        prev
          ? {
              ...prev,
              name,
              country,
              role,
              profile: {
                ...(prev.profile ?? {}),
                firstName,
                lastName,
                phone,
                addressLine1,
                addressLine2,
                city,
                postalCode,
                country: profileCountry,
                province,
              },
            }
          : {
              email: user?.email ?? "",
              name,
              country,
              role,
              profile: {
                firstName,
                lastName,
                phone,
                addressLine1,
                addressLine2,
                city,
                postalCode,
                country: profileCountry,
                province,
              },
            }
      );
      setUser((prev) =>
        prev
          ? {
              ...prev,
              name,
              country,
              role,
              profile: {
                ...(prev.profile ?? {}),
                firstName,
                lastName,
                phone,
                addressLine1,
                addressLine2,
                city,
                postalCode,
                country: profileCountry,
                province,
              },
            }
          : prev
      );
      setStatus("saved");
      toast.success(t.profileSaved);
    } catch {
      setStatus("error");
      toast.error(t.profileSaveError);
    } finally {
      setSaving(false);
      setTimeout(() => setStatus("idle"), 2000);
    }
  }

  function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.currentTarget.files?.[0] || null;
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error(t.imageOnly);
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error(t.imageTooLarge);
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
      toast.success(t.avatarUpdated);
    } catch (e) {
      console.error(e);
      setAvatarStatus("error");
      toast.error(t.avatarUploadFailed);
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
        toast.success(t.avatarDeleted);
      } else {
        toast.error(t.avatarDeleteFailed);
      }
    } catch {
      toast.error(t.avatarDeleteFailed);
    }
  }

  const fullName = useMemo(() => {
    const p = user?.profile;
    if (p?.firstName || p?.lastName) {
      return `${p?.firstName ?? ""} ${p?.lastName ?? ""}`.trim();
    }
    return user?.name ?? user?.email ?? t.defaultUser;
  }, [user, t.defaultUser]);

  const cityLine = useMemo(() => {
    const p = user?.profile;
    if (p?.city || p?.country) {
      return `${p?.city ?? ""}${
        p?.city && p?.country ? ", " : ""
      }${p?.country ?? ""}`;
    }
    return t.completeProfile;
  }, [user, t.completeProfile]);

  const memberSinceYear = useMemo(() => {
    if (!user?.createdAt) return null;
    const d = new Date(user.createdAt);
    if (Number.isNaN(d.getTime())) return null;
    return d.getFullYear();
  }, [user]);

  const tripsCount = trips.length;

  // Afficher un loader pendant le chargement
  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 pb-12 pt-10">
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl 2xl:max-w-7xl px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12 pt-6 sm:pt-10">
      {/* Layout principal */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
        {/* Colonne gauche – menu comme Airbnb */}
        <aside className="w-full lg:w-64 shrink-0">
          <h1 className="mb-6 text-2xl font-semibold">{t.title}</h1>

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
                  {t.aboutMe}
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
              <span className="text-sm font-medium">{t.previousTrips}</span>
            </button>
          </nav>
        </aside>

        {/* Colonne droite – contenu principal */}
        <section className="flex-1 space-y-8">
          {tab === "about" ? (
            <AboutSection
              t={t}
              locale={locale}
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
              firstName={firstName}
              lastName={lastName}
              phone={phone}
              addressLine1={addressLine1}
              addressLine2={addressLine2}
              city={city}
              postalCode={postalCode}
              profileCountry={profileCountry}
              province={province}
              setName={setName}
              setFirstName={setFirstName}
              setLastName={setLastName}
              setPhone={setPhone}
              setAddressLine1={setAddressLine1}
              setAddressLine2={setAddressLine2}
              setCity={setCity}
              setPostalCode={setPostalCode}
              setProfileCountry={setProfileCountry}
              setProvince={setProvince}
              onSave={onSave}
              saving={saving}
              changed={changed}
              status={status}
              profileEditRequested={profileEditRequested}
              onConsumeProfileEdit={() => setProfileEditRequested(false)}
            />
          ) : (
            <TripsSection t={t} trips={trips} loading={tripsLoading} />
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
  t: ProfileTranslations;
  locale: string;
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
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postalCode: string;
  profileCountry: string;
  province: string;
  setName: Dispatch<SetStateAction<string>>;
  setFirstName: Dispatch<SetStateAction<string>>;
  setLastName: Dispatch<SetStateAction<string>>;
  setPhone: Dispatch<SetStateAction<string>>;
  setAddressLine1: Dispatch<SetStateAction<string>>;
  setAddressLine2: Dispatch<SetStateAction<string>>;
  setCity: Dispatch<SetStateAction<string>>;
  setPostalCode: Dispatch<SetStateAction<string>>;
  setProfileCountry: Dispatch<SetStateAction<string>>;
  setProvince: Dispatch<SetStateAction<string>>;
  onSave: (e: React.FormEvent) => void;
  saving: boolean;
  changed: boolean;
  status: "idle" | "saved" | "error";
  profileEditRequested: boolean;
  onConsumeProfileEdit: () => void;
};

function AboutSection(props: AboutProps) {
  const {
    t,
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
    firstName,
    lastName,
    phone,
    addressLine1,
    addressLine2,
    city,
    postalCode,
    profileCountry,
    province,
    setName,
    setFirstName,
    setLastName,
    setPhone,
    setAddressLine1,
    setAddressLine2,
    setCity,
    setPostalCode,
    setProfileCountry,
    setProvince,
    onSave,
    saving,
    changed,
    status,
    profileEditRequested,
    onConsumeProfileEdit,
  } = props;

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPublic, setIsEditingPublic] = useState(false);

  // états d'édition pour chaque ligne "Modifier"
  const [editingLegalName, setEditingLegalName] = useState(false);
  const [editingChosenName, setEditingChosenName] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);

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

  const jobTitle = publicJobTitle || t.addJob;
  const dreamDestination = publicDreamDestination || t.addDreamDestination;
  const languages = publicLanguages || t.addLanguages;
  const aboutMe = publicAboutMe || t.aboutMePlaceholder;
  const interests = publicInterests || t.addInterests;

  // ⚙️ Infos compte (on utilise les états éditables)
  const legalName =
    (firstName || lastName ? `${firstName} ${lastName}`.trim() : fullName) ||
    t.notProvided;

  const chosenName = name || t.notProvided;
  const phoneDisplay = phone || t.notProvided;
  const accountVerificationNumber = t.notProvided;
  const identityStatus = t.verified; // placeholder

  const hasResidential =
    addressLine1 || city || postalCode || profileCountry || province;

  const residentialAddress = hasResidential
    ? `${addressLine1}${addressLine1 ? ", " : ""}${postalCode} ${city}${
        profileCountry ? `, ${profileCountry}` : ""
      }${province ? ` (${province})` : ""}`.trim()
    : t.notProvided;

  const postalAddress =
    residentialAddress !== t.notProvided ? t.provided : t.notProvidedFemale;

  const emergencyContact = t.notProvided;

  function handleSoon() {
    toast.info(t.comingSoon);
  }

  // sauvegarde des infos publiques (pour l'instant uniquement front)
  const [savingPublic, setSavingPublic] = useState(false);
  async function onSavePublic(e: React.FormEvent) {
    e.preventDefault();
    setSavingPublic(true);
    try {
      toast.success(t.publicInfoUpdated);
      setIsEditingPublic(false);
    } catch {
      toast.error(t.publicInfoUpdateFailed);
    } finally {
      setSavingPublic(false);
    }
  }

  return (
    <>
      {/* Titre seul */}
      <div className="mb-4">
        <h2 className="text-2xl font-semibold">{t.aboutMe}</h2>
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
              {t.lokroomProfile}
            </p>
            <h3 className="text-xl font-semibold">{fullName}</h3>
            <p className="text-sm text-gray-500">{cityLine}</p>
            <p className="text-xs text-gray-400">
              {t.lokroomMember}
              {memberSinceYear ? ` ${t.memberSince.toLowerCase()} ${memberSinceYear}` : ""}
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
            {t.editProfile}
          </button>

          <div className="flex gap-10 text-center">
            <div>
              <div className="text-lg font-semibold">{tripsCount}</div>
              <div className="text-gray-500">{t.tripsCount}</div>
            </div>
            <div>
              <div className="text-lg font-semibold">{reviewsCount}</div>
              <div className="text-gray-500">{t.reviewsCount}</div>
            </div>
            <div>
              <div className="text-lg font-semibold">{rating}</div>
              <div className="text-gray-500">{t.averageRating}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Colonne d'infos "sur moi" avec icônes propres */}
      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 text-sm md:grid-cols-2">
          <div className="space-y-3">
            {/* Travail */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
                {/* Briefcase */}
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
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
                <span className="font-medium">{t.myJob} :</span>{" "}
                <span className="text-gray-700">{jobTitle}</span>
              </p>
            </div>

            {/* Destination de rêve */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
                {/* Globe / avion */}
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
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
                <span className="font-medium">{t.dreamDestination} :</span>{" "}
                <span className="text-gray-700">{dreamDestination}</span>
              </p>
            </div>

            {/* Langues */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
                {/* Bulle de discussion */}
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
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
                <span className="font-medium">{t.languagesSpoken} :</span>{" "}
                <span className="text-gray-700">{languages}</span>
              </p>
            </div>

            {/* Identité vérifiée */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
                {/* Bouclier */}
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
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
                <span className="font-medium">{t.identityVerification} :</span>{" "}
                <span className="text-gray-700">
                  {profile ? t.verificationSoon : t.notProvided}
                </span>
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="mb-1 text-sm font-medium">{t.aboutMeSection}</p>
              <p className="text-gray-700">{aboutMe}</p>
            </div>
            <div>
              <p className="mb-1 text-sm font-medium">{t.interests}</p>
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
            {t.editPublicInfo}
          </button>
        </div>
      </section>

      {/* Bloc "Commentaires sur moi" */}
      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-2 text-base font-semibold">{t.commentsAboutMe}</h3>
        <p className="text-sm text-gray-600">
          {t.commentsDesc}
        </p>
      </section>

      {/* 🔥 MODAL PROFIL (avatar + info compte avec petites bulles Modifier) */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          {/* Backdrop flouté */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsEditingProfile(false)}
          />

          {/* Bulle d'édition */}
          <section
            className="relative z-50 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold">
                {t.photoAndInfo}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="text-sm text-gray-500 hover:text-black"
              >
                {t.close}
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
                    {t.chooseFile}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={onPickAvatar}
                      className="hidden"
                    />
                  </label>
                  <span className="max-w-[200px] truncate text-xs text-gray-500 sm:max-w-xs">
                    {avatarFile?.name ?? t.noFileChosen}
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
                      ? t.preparing
                      : avatarStatus === "uploading"
                      ? t.uploading
                      : avatarStatus === "saving"
                      ? t.saving
                      : t.uploadAvatar}
                  </button>

                  <button
                    type="button"
                    onClick={onDeleteAvatar}
                    className="rounded-full border border-gray-300 px-4 py-2 text-xs font-medium sm:text-sm"
                  >
                    {t.deleteAvatar}
                  </button>
                </div>
              </div>
            </div>

            {/* Email affiché en haut */}
            <p className="mb-4 text-xs text-gray-500">
              {t.email} : <span className="font-mono">{email}</span>
            </p>

            {/* 🔽 Informations du compte (chaque ligne modifiable) */}
            <form onSubmit={onSave}>
              <h3 className="mb-4 text-base font-semibold">
                {t.accountInfo}
              </h3>

              <div className="divide-y divide-gray-100 text-sm">
                {/* Nom légal */}
                <div className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-400">
                        {t.legalName}
                      </p>
                      <p className="font-medium text-gray-800">{legalName}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingLegalName((prev) => !prev)
                      }
                      className="text-sm font-medium text-gray-700 hover:underline"
                    >
                      {editingLegalName ? t.cancel : t.modify}
                    </button>
                  </div>
                  {editingLegalName && (
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      <input
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                        value={firstName}
                        onChange={(e) =>
                          setFirstName(e.currentTarget.value)
                        }
                        placeholder={t.firstNameOnId}
                      />
                      <input
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                        value={lastName}
                        onChange={(e) =>
                          setLastName(e.currentTarget.value)
                        }
                        placeholder={t.lastNameOnId}
                      />
                    </div>
                  )}
                </div>

                {/* Nom choisi */}
                <div className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-400">
                        {t.chosenName}
                      </p>
                      <p className="font-medium text-gray-800">
                        {chosenName === t.notProvided
                          ? t.notProvided
                          : chosenName}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingChosenName((prev) => !prev)
                      }
                      className="text-sm font-medium text-gray-700 hover:underline"
                    >
                      {editingChosenName
                        ? t.cancel
                        : chosenName === t.notProvided
                        ? t.add
                        : t.modify}
                    </button>
                  </div>
                  {editingChosenName && (
                    <div className="mt-3">
                      <input
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                        value={name}
                        onChange={(e) =>
                          setName(e.currentTarget.value)
                        }
                        placeholder={t.displayName}
                      />
                    </div>
                  )}
                </div>

                {/* Adresse courriel */}
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400">
                      {t.emailAddress}
                    </p>
                    <p className="font-mono text-gray-800">{email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSoon}
                    className="text-sm font-medium text-gray-700 hover:underline"
                  >
                    {t.modify}
                  </button>
                </div>

                {/* Numéro de téléphone */}
                <div className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-400">
                        {t.phoneNumber}
                      </p>
                      <p className="text-gray-800">{phoneDisplay}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingPhone((prev) => !prev)
                      }
                      className="text-sm font-medium text-gray-700 hover:underline"
                    >
                      {editingPhone
                        ? t.cancel
                        : phoneDisplay === t.notProvided
                        ? t.add
                        : t.modify}
                    </button>
                  </div>
                  {editingPhone && (
                    <div className="mt-3">
                      <input
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                        value={phone}
                        onChange={(e) => {
                          // N'accepter que les chiffres et le + (pour l'indicatif international)
                          const value = e.currentTarget.value.replace(/[^0-9+]/g, '');
                          // Le + ne peut être qu'au début
                          const sanitized = value.charAt(0) === '+'
                            ? '+' + value.slice(1).replace(/\+/g, '')
                            : value.replace(/\+/g, '');
                          setPhone(sanitized);
                        }}
                        onKeyDown={(e) => {
                          // Bloquer les lettres et caractères spéciaux (sauf + au début)
                          const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
                          if (allowedKeys.includes(e.key)) return;
                          if (e.key === '+' && e.currentTarget.selectionStart === 0 && !phone.includes('+')) return;
                          if (!/[0-9]/.test(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        placeholder={t.phonePlaceholder}
                      />
                    </div>
                  )}
                </div>

                {/* Numéro de vérification du compte */}
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400">
                      {t.accountVerification}
                    </p>
                    <p className="text-gray-800">
                      {accountVerificationNumber}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSoon}
                    className="text-sm font-medium text-gray-700 hover:underline"
                  >
                    {t.modify}
                  </button>
                </div>

                {/* Vérification identité */}
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400">
                      {t.identityVerificationLabel}
                    </p>
                    <p className="text-gray-800">{identityStatus}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSoon}
                    className="text-sm font-medium text-gray-700 hover:underline"
                  >
                    {t.modify}
                  </button>
                </div>

                {/* Adresse résidentielle */}
                <div className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-400">
                        {t.residentialAddress}
                      </p>
                      <p className="text-gray-800">
                        {residentialAddress}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingAddress((prev) => !prev)
                      }
                      className="text-sm font-medium text-gray-700 hover:underline"
                    >
                      {editingAddress
                        ? t.cancel
                        : residentialAddress === t.notProvided
                        ? t.add
                        : t.modify}
                    </button>
                  </div>
                  {editingAddress && (
                    <div className="mt-3 space-y-2">
                      <input
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                        value={addressLine1}
                        onChange={(e) =>
                          setAddressLine1(e.currentTarget.value)
                        }
                        placeholder={t.streetNumber}
                      />
                      <input
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                        value={addressLine2}
                        onChange={(e) =>
                          setAddressLine2(e.currentTarget.value)
                        }
                        placeholder={t.addressComplement}
                      />
                      <div className="grid gap-2 md:grid-cols-2">
                        <input
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                          value={postalCode}
                          onChange={(e) =>
                            setPostalCode(e.currentTarget.value)
                          }
                          placeholder={t.postalCode}
                        />
                        <input
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                          value={city}
                          onChange={(e) =>
                            setCity(e.currentTarget.value)
                          }
                          placeholder={t.city}
                        />
                      </div>
                      <div className="grid gap-2 md:grid-cols-2">
                        <input
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                          value={profileCountry}
                          onChange={(e) =>
                            setProfileCountry(e.currentTarget.value)
                          }
                          placeholder={t.countryPlaceholder}
                        />
                        <input
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                          value={province}
                          onChange={(e) =>
                            setProvince(e.currentTarget.value)
                          }
                          placeholder={t.provinceRegion}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Adresse postale */}
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400">
                      {t.postalAddressLabel}
                    </p>
                    <p className="text-gray-800">{postalAddress}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSoon}
                    className="text-sm font-medium text-gray-700 hover:underline"
                  >
                    {postalAddress === t.notProvidedFemale
                      ? t.add
                      : t.modify}
                  </button>
                </div>

                {/* Contact d'urgence */}
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400">
                      {t.emergencyContact}
                    </p>
                    <p className="text-gray-800">{emergencyContact}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSoon}
                    className="text-sm font-medium text-gray-700 hover:underline"
                  >
                    {emergencyContact === t.notProvided
                      ? t.add
                      : t.modify}
                  </button>
                </div>
              </div>

              {/* Bouton global Enregistrer en bas de la bulle */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={saving || !changed}
                  className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {saving ? t.saving : t.save}
                </button>

                {status === "saved" && (
                  <span className="text-sm text-green-700">
                    {t.saved}
                  </span>
                )}
                {status === "error" && (
                  <span className="text-sm text-red-600">
                    {t.errorSaving}
                  </span>
                )}
              </div>
            </form>
          </section>
        </div>
      )}

      {/* 🔥 MODAL INFOS PUBLIQUES (travail, langues, description, centres d'intérêt) */}
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
                {t.editPublicInfoTitle}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingPublic(false)}
                className="text-sm text-gray-500 hover:text-black"
              >
                {t.close}
              </button>
            </div>

            <form className="space-y-4 text-sm" onSubmit={onSavePublic}>
              <div>
                <label className="mb-1 block font-medium">{t.myJob}</label>
                <input
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none"
                  value={publicJobTitle}
                  onChange={(e) => setPublicJobTitle(e.currentTarget.value)}
                  placeholder={t.jobPlaceholder}
                />
              </div>

              <div>
                <label className="mb-1 block font-medium">
                  {t.dreamDestination}
                </label>
                <input
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none"
                  value={publicDreamDestination}
                  onChange={(e) =>
                    setPublicDreamDestination(e.currentTarget.value)
                  }
                  placeholder={t.dreamDestinationPlaceholder}
                />
              </div>

              <div>
                <label className="mb-1 block font-medium">{t.languagesSpoken}</label>
                <input
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none"
                  value={publicLanguages}
                  onChange={(e) => setPublicLanguages(e.currentTarget.value)}
                  placeholder={t.languagesPlaceholder}
                />
              </div>

              <div>
                <label className="mb-1 block font-medium">{t.aboutMeSection}</label>
                <textarea
                  className="min-h-[80px] w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none"
                  value={publicAboutMe}
                  onChange={(e) => setPublicAboutMe(e.currentTarget.value)}
                  placeholder={t.aboutMeFieldPlaceholder}
                />
              </div>

              <div>
                <label className="mb-1 block font-medium">
                  {t.interests}
                </label>
                <textarea
                  className="min-h-[60px] w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none"
                  value={publicInterests}
                  onChange={(e) => setPublicInterests(e.currentTarget.value)}
                  placeholder={t.interestsPlaceholder}
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={savingPublic}
                  className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {savingPublic ? t.saving : t.save}
                </button>
                <p className="text-xs text-gray-500">
                  {t.publicInfoNote}
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
  t,
  trips,
  loading,
}: {
  t: ProfileTranslations;
  trips: BookingDTO[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <section className="rounded-3xl border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">
        {t.loadingTrips}
      </section>
    );
  }

  if (!trips.length) {
    return (
      <section className="rounded-3xl border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">
        <h3 className="mb-2 text-base font-semibold">{t.previousTrips}</h3>
        <p>
          {t.noTripsYet}
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h3 className="text-base font-semibold">{t.previousTrips}</h3>
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

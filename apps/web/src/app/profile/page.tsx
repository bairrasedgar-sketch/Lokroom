"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import useTranslation from "@/hooks/useTranslation";
import { useGoogleMaps } from "@/components/GoogleMapsLoader";

// Liste des pays (les plus courants en premier)
const COUNTRIES_LIST = [
  "France", "Canada", "Belgique", "Suisse", "Luxembourg",
  "États-Unis", "Royaume-Uni", "Allemagne", "Espagne", "Italie",
  "Portugal", "Pays-Bas", "Autriche", "Irlande", "Australie",
  "Maroc", "Algérie", "Tunisie", "Sénégal", "Côte d'Ivoire",
  "Cameroun", "République démocratique du Congo", "Madagascar",
  "Brésil", "Mexique", "Argentine", "Chili", "Colombie",
  "Japon", "Chine", "Corée du Sud", "Inde", "Vietnam",
  "Thaïlande", "Indonésie", "Philippines", "Singapour",
  "Émirats arabes unis", "Qatar", "Arabie saoudite",
  "Pologne", "République tchèque", "Hongrie", "Roumanie",
  "Grèce", "Turquie", "Russie", "Ukraine", "Norvège", "Suède", "Danemark", "Finlande"
];


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

  // Toggles de visibilité pour les infos publiques
  showCity?: boolean;
  showCountry?: boolean;
  showJobTitle?: boolean;
  showLanguages?: boolean;
  showAboutMe?: boolean;
  showInterests?: boolean;
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
  const searchParams = useSearchParams();
  const router = useRouter();

  // Mode aperçu (lecture seule)
  const isPreviewMode = searchParams.get("preview") === "true";

  // Mode édition directe (depuis le bouton "Modifier le profil")
  const isEditMode = searchParams.get("edit") === "true";

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

  // Autocomplétion ville/pays
  const [citySearch, setCitySearch] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [showCountrySuggestions, setShowCountrySuggestions] = useState(false);
  const [citySuggestions, setCitySuggestions] = useState<Array<{
    place_id: string;
    description: string;
    structured_formatting?: { main_text?: string; secondary_text?: string };
  }>>([]);
  const { isLoaded: googleMapsLoaded } = useGoogleMaps();
  const cityDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Recherche de villes via Google Places
  useEffect(() => {
    if (!citySearch || citySearch.length < 2 || !googleMapsLoaded) {
      setCitySuggestions([]);
      return;
    }

    if (cityDebounceRef.current) {
      clearTimeout(cityDebounceRef.current);
    }

    cityDebounceRef.current = setTimeout(() => {
      const google = (window as Window & { google?: { maps: { places: { AutocompleteService: new () => { getPlacePredictions: (req: { input: string; types: string[] }, cb: (results: Array<{ place_id: string; description: string; structured_formatting?: { main_text?: string; secondary_text?: string } }> | null, status: string) => void) => void }; PlacesServiceStatus: { OK: string } } } } }).google;
      if (!google?.maps?.places?.AutocompleteService) return;

      const service = new google.maps.places.AutocompleteService();
      service.getPlacePredictions(
        { input: citySearch, types: ["(cities)"] },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setCitySuggestions(predictions);
          } else {
            setCitySuggestions([]);
          }
        }
      );
    }, 200);

    return () => {
      if (cityDebounceRef.current) {
        clearTimeout(cityDebounceRef.current);
      }
    };
  }, [citySearch, googleMapsLoaded]);

  // Fermer les suggestions quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = () => {
      setShowCitySuggestions(false);
      setShowCountrySuggestions(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

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

  // Si mode édition, ouvrir directement la modal
  useEffect(() => {
    if (isEditMode && !loading) {
      setProfileEditRequested(true);
    }
  }, [isEditMode, loading]);

  // 1️⃣ Chargement du profil
  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch("/api/profile", { cache: "no-store", signal: controller.signal });
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
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') return;
        // silencieux
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  // 2️⃣ Chargement des voyages précédents
  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch("/api/account/trips", { cache: "no-store", signal: controller.signal });
        if (!res.ok) {
          setTrips([]);
          return;
        }
        const data = (await res.json()) as { trips?: BookingDTO[] };
        setTrips(data.trips ?? []);
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') return;
        setTrips([]);
      } finally {
        setTripsLoading(false);
      }
    })();

    return () => controller.abort();
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
      <main className="mx-auto max-w-6xl 2xl:max-w-7xl px-4 sm:px-6 lg:px-8 pb-12 pt-10">
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
        </div>
      </main>
    );
  }

  // ========== VUE PUBLIQUE (mode preview) ==========
  if (isPreviewMode) {
    return (
      <PublicProfileView
        user={user}
        fullName={fullName}
        cityLine={cityLine}
        memberSinceYear={memberSinceYear}
        avatarPreview={avatarPreview}
        trips={trips}
        tripsLoading={tripsLoading}
        router={router}
        t={t}
      />
    );
  }

  return (
    <main className="mx-auto max-w-6xl 2xl:max-w-7xl bg-gray-50 lg:bg-transparent min-h-screen lg:min-h-0 px-0 lg:px-8 pb-8 sm:pb-12 pt-0 lg:pt-10">

      {/* Layout principal */}
      <div className="flex flex-col lg:flex-row gap-0 lg:gap-10">
        {/* Colonne gauche – menu comme Airbnb (desktop only) */}
        <aside className="hidden lg:block w-full lg:w-64 shrink-0">
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
                  <Image
                    src={avatarPreview}
                    alt={fullName}
                    fill
                    className="object-cover"
                    sizes="40px"
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

        {/* Mobile Header - Profile Card Style Airbnb */}
        <div className="lg:hidden">
          {/* Header profil mobile centré */}
          <div className="bg-white px-4 pt-6 pb-4">
            {/* Avatar centré */}
            <div className="flex flex-col items-center">
              <div className="relative h-24 w-24 overflow-hidden rounded-full bg-gray-200 border-2 border-gray-100 shadow-sm">
                {avatarPreview ? (
                  <Image
                    src={avatarPreview}
                    alt={fullName}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-3xl font-semibold text-gray-600">
                    {fullName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Nom centré */}
              <h1 className="mt-3 text-xl font-bold text-gray-900">{fullName}</h1>

              {/* Localisation */}
              <p className="mt-1 text-sm text-gray-500">{cityLine}</p>

              {/* Badge vérifié si applicable */}
              {user?.profile && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-600">
                  <svg className="h-4 w-4 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>{t.lokroomMember}</span>
                </div>
              )}
            </div>

            {/* Stats en ligne horizontale */}
            <div className="mt-6 flex items-center justify-center">
              <div className="flex items-center divide-x divide-gray-200">
                <div className="px-6 text-center">
                  <div className="text-xl font-bold text-gray-900">{trips.length}</div>
                  <div className="text-xs text-gray-500">{t.tripsCount}</div>
                </div>
                <div className="px-6 text-center">
                  <div className="text-xl font-bold text-gray-900">{user?.profile?.ratingCount ?? 0}</div>
                  <div className="text-xs text-gray-500">{t.reviewsCount}</div>
                </div>
                <div className="px-6 text-center">
                  <div className="text-xl font-bold text-gray-900">
                    {typeof user?.profile?.ratingAvg === "number" ? user.profile.ratingAvg.toFixed(1) : "–"}
                  </div>
                  <div className="text-xs text-gray-500">{t.averageRating}</div>
                </div>
              </div>
            </div>

            {/* Bouton Modifier le profil - pleine largeur (caché en mode aperçu) */}
            {!isPreviewMode && (
              <button
                type="button"
                onClick={() => setProfileEditRequested(true)}
                className="mt-6 w-full rounded-xl border-2 border-gray-900 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-900 hover:text-white transition-colors"
              >
                {t.editProfile}
              </button>
            )}
          </div>

          {/* Navigation onglets mobile */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
            <div className="flex">
              <button
                type="button"
                onClick={() => setTab("about")}
                className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors ${
                  tab === "about"
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-500"
                }`}
              >
                {t.aboutMe}
              </button>
              <button
                type="button"
                onClick={() => setTab("trips")}
                className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors ${
                  tab === "trips"
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-500"
                }`}
              >
                {t.previousTrips}
              </button>
            </div>
          </div>
        </div>

        {/* Colonne droite – contenu principal */}
        <section className="flex-1 space-y-4 lg:space-y-8 px-4 lg:px-0 py-4 lg:py-0">
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
              isPreviewMode={isPreviewMode}
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
  isPreviewMode?: boolean;
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
    isPreviewMode = false,
  } = props;

  const router = useRouter();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPublic, setIsEditingPublic] = useState(false);

  // etats d'edition pour chaque ligne "Modifier"
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

  // etats locaux pour les infos publiques
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

  // etats pour les toggles de visibilite
  const [showCity, setShowCity] = useState(profile?.showCity ?? true);
  const [showCountry, setShowCountry] = useState(profile?.showCountry ?? true);
  const [showJobTitle, setShowJobTitle] = useState(profile?.showJobTitle ?? true);
  const [showLanguages, setShowLanguages] = useState(profile?.showLanguages ?? true);
  const [showAboutMe, setShowAboutMe] = useState(profile?.showAboutMe ?? true);
  const [showInterests, setShowInterests] = useState(profile?.showInterests ?? true);

  // Autocomplétion ville/pays
  const [citySearch, setCitySearch] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [showCountrySuggestions, setShowCountrySuggestions] = useState(false);
  const [citySuggestions, setCitySuggestions] = useState<Array<{
    place_id: string;
    description: string;
    structured_formatting?: { main_text?: string; secondary_text?: string };
  }>>([]);
  const { isLoaded: googleMapsLoaded } = useGoogleMaps();
  const cityDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Recherche de villes via Google Places
  useEffect(() => {
    if (!citySearch || citySearch.length < 2 || !googleMapsLoaded) {
      setCitySuggestions([]);
      return;
    }

    if (cityDebounceRef.current) {
      clearTimeout(cityDebounceRef.current);
    }

    cityDebounceRef.current = setTimeout(() => {
      const google = (window as Window & { google?: { maps: { places: { AutocompleteService: new () => { getPlacePredictions: (req: { input: string; types: string[] }, cb: (results: Array<{ place_id: string; description: string; structured_formatting?: { main_text?: string; secondary_text?: string } }> | null, status: string) => void) => void }; PlacesServiceStatus: { OK: string } } } } }).google;
      if (!google?.maps?.places?.AutocompleteService) return;

      const service = new google.maps.places.AutocompleteService();
      service.getPlacePredictions(
        { input: citySearch, types: ["(cities)"] },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setCitySuggestions(predictions);
          } else {
            setCitySuggestions([]);
          }
        }
      );
    }, 200);

    return () => {
      if (cityDebounceRef.current) {
        clearTimeout(cityDebounceRef.current);
      }
    };
  }, [citySearch, googleMapsLoaded]);

  // Fermer les suggestions quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = () => {
      setShowCitySuggestions(false);
      setShowCountrySuggestions(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    setPublicJobTitle(profile?.jobTitle ?? "");
    setPublicDreamDestination(profile?.dreamDestination ?? "");
    setPublicLanguages(profile?.languages ?? "");
    setPublicAboutMe(profile?.aboutMe ?? "");
    setPublicInterests(profile?.interests ?? "");
    setShowCity(profile?.showCity ?? true);
    setShowCountry(profile?.showCountry ?? true);
    setShowJobTitle(profile?.showJobTitle ?? true);
    setShowLanguages(profile?.showLanguages ?? true);
    setShowAboutMe(profile?.showAboutMe ?? true);
    setShowInterests(profile?.showInterests ?? true);
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
      {/* Titre seul - desktop only */}
      <div className="hidden lg:block mb-4">
        <h2 className="text-2xl font-semibold">{t.aboutMe}</h2>
      </div>

      {/* Carte principale profil + stats + bouton Modifier le profil - desktop only */}
      <section className="hidden lg:flex flex-col gap-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-6">
          <div className="relative h-20 w-20 overflow-hidden rounded-full bg-gray-200">
            {avatarPreview ? (
              <Image
                src={avatarPreview}
                alt={fullName}
                fill
                className="object-cover"
                sizes="80px"
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
      <section className="rounded-2xl lg:rounded-3xl border-0 lg:border border-gray-200 bg-white p-4 lg:p-6 shadow-sm">
        {/* Titre section mobile */}
        <h3 className="lg:hidden mb-4 text-base font-semibold text-gray-900">{t.aboutMeSection}</h3>

        <div className="grid gap-4 text-sm lg:grid-cols-2">
          {/* Cards empilées sur mobile */}
          <div className="space-y-3">
            {/* Travail */}
            <div className="flex items-center gap-3 p-3 lg:p-0 rounded-xl lg:rounded-none bg-gray-50 lg:bg-transparent">
              <div className="flex h-10 w-10 lg:h-9 lg:w-9 items-center justify-center rounded-full bg-white lg:bg-gray-100 shadow-sm lg:shadow-none">
                {/* Briefcase */}
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-gray-700" aria-hidden="true">
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
              <div className="flex-1">
                <p className="text-xs text-gray-500 lg:hidden">{t.myJob}</p>
                <p className="lg:hidden font-medium text-gray-900">{jobTitle}</p>
                <p className="hidden lg:block">
                  <span className="font-medium">{t.myJob} :</span>{" "}
                  <span className="text-gray-700">{jobTitle}</span>
                </p>
              </div>
            </div>

            {/* Destination de rêve */}
            <div className="flex items-center gap-3 p-3 lg:p-0 rounded-xl lg:rounded-none bg-gray-50 lg:bg-transparent">
              <div className="flex h-10 w-10 lg:h-9 lg:w-9 items-center justify-center rounded-full bg-white lg:bg-gray-100 shadow-sm lg:shadow-none">
                {/* Globe / avion */}
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-gray-700" aria-hidden="true">
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
              <div className="flex-1">
                <p className="text-xs text-gray-500 lg:hidden">{t.dreamDestination}</p>
                <p className="lg:hidden font-medium text-gray-900">{dreamDestination}</p>
                <p className="hidden lg:block">
                  <span className="font-medium">{t.dreamDestination} :</span>{" "}
                  <span className="text-gray-700">{dreamDestination}</span>
                </p>
              </div>
            </div>

            {/* Langues */}
            <div className="flex items-center gap-3 p-3 lg:p-0 rounded-xl lg:rounded-none bg-gray-50 lg:bg-transparent">
              <div className="flex h-10 w-10 lg:h-9 lg:w-9 items-center justify-center rounded-full bg-white lg:bg-gray-100 shadow-sm lg:shadow-none">
                {/* Bulle de discussion */}
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-gray-700" aria-hidden="true">
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
              <div className="flex-1">
                <p className="text-xs text-gray-500 lg:hidden">{t.languagesSpoken}</p>
                <p className="lg:hidden font-medium text-gray-900">{languages}</p>
                <p className="hidden lg:block">
                  <span className="font-medium">{t.languagesSpoken} :</span>{" "}
                  <span className="text-gray-700">{languages}</span>
                </p>
              </div>
            </div>

            {/* Identité vérifiée */}
            <div className="flex items-center gap-3 p-3 lg:p-0 rounded-xl lg:rounded-none bg-gray-50 lg:bg-transparent">
              <div className="flex h-10 w-10 lg:h-9 lg:w-9 items-center justify-center rounded-full bg-white lg:bg-gray-100 shadow-sm lg:shadow-none">
                {/* Bouclier */}
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-gray-700" aria-hidden="true">
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
              <div className="flex-1">
                <p className="text-xs text-gray-500 lg:hidden">{t.identityVerification}</p>
                <p className="lg:hidden font-medium text-gray-900">
                  {profile ? t.verificationSoon : t.notProvided}
                </p>
                <p className="hidden lg:block">
                  <span className="font-medium">{t.identityVerification} :</span>{" "}
                  <span className="text-gray-700">
                    {profile ? t.verificationSoon : t.notProvided}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Section description et interets */}
          <div className="space-y-4 lg:space-y-3 mt-2 lg:mt-0">
            <div className="p-3 lg:p-0 rounded-xl lg:rounded-none bg-gray-50 lg:bg-transparent">
              <p className="mb-1 text-xs lg:text-sm font-medium text-gray-500 lg:text-gray-900">{t.aboutMeSection}</p>
              <p className="text-gray-900 lg:text-gray-700">{aboutMe}</p>
            </div>
            <div className="p-3 lg:p-0 rounded-xl lg:rounded-none bg-gray-50 lg:bg-transparent">
              <p className="mb-1 text-xs lg:text-sm font-medium text-gray-500 lg:text-gray-900">{t.interests}</p>
              <p className="text-gray-900 lg:text-gray-700">{interests}</p>
            </div>
          </div>
        </div>

        {/* Bulle 2 : Modifier mes infos publiques en bas à droite (caché en mode aperçu) */}
        {!isPreviewMode && (
          <div className="mt-4 flex justify-center lg:justify-end">
            <button
              type="button"
              onClick={() => setIsEditingPublic(true)}
              className="w-full lg:w-auto rounded-xl lg:rounded-full border border-gray-300 px-4 py-3 lg:py-2 text-sm font-medium hover:border-black hover:text-black"
            >
              {t.editPublicInfo}
            </button>
          </div>
        )}
      </section>

      {/* Bloc "Commentaires sur moi" */}
      <section className="rounded-2xl lg:rounded-3xl border-0 lg:border border-gray-200 bg-white p-4 lg:p-6 shadow-sm">
        <h3 className="mb-3 lg:mb-2 text-base font-semibold">{t.commentsAboutMe}</h3>
        <p className="text-sm text-gray-600">
          {t.commentsDesc}
        </p>
      </section>

      {/* 🔥 MODAL PROFIL - VERSION MOBILE MODERNE */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 lg:z-40 lg:flex lg:items-center lg:justify-center lg:p-4">
          {/* Backdrop - visible uniquement sur desktop */}
          <div
            className="hidden lg:block fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setIsEditingProfile(false);
              router.push('/account');
            }}
          />

          {/* MOBILE: Plein écran moderne et complet */}
          <div className="lg:hidden fixed inset-0 bg-[#F5F5F5] flex flex-col">
            {/* Header avec effet glass */}
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
              <div className="flex items-center justify-between px-4 h-14">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingProfile(false);
                    router.push('/account');
                  }}
                  className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full active:bg-gray-100"
                >
                  <svg className="w-6 h-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <h1 className="text-[17px] font-semibold text-gray-900">Modifier le profil</h1>
                <button
                  type="button"
                  onClick={async () => {
                    await onSave({} as React.FormEvent);
                    setIsEditingProfile(false);
                    router.push('/account');
                  }}
                  disabled={saving}
                  className="text-[17px] font-semibold text-[#007AFF] disabled:opacity-50 active:opacity-70"
                >
                  {saving ? "..." : "Enregistrer"}
                </button>
              </div>
            </div>

            {/* Contenu scrollable */}
            <div className="flex-1 overflow-y-auto pb-8">
              {/* Section Photo */}
              <div className="bg-white mt-4 mx-4 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-6 flex flex-col items-center">
                  <div className="relative">
                    <div className="h-28 w-28 overflow-hidden rounded-full bg-gradient-to-br from-gray-100 to-gray-200 ring-4 ring-white shadow-lg">
                      {avatarPreview ? (
                        <Image src={avatarPreview} alt="avatar" fill className="object-cover" sizes="112px" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-4xl font-bold text-gray-400">
                          {fullName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 w-9 h-9 bg-[#007AFF] rounded-full flex items-center justify-center shadow-lg cursor-pointer active:scale-95 transition-transform">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <input type="file" accept="image/*" onChange={onPickAvatar} className="hidden" />
                    </label>
                  </div>
                  <p className="mt-4 text-lg font-semibold text-gray-900">{fullName || "Votre nom"}</p>
                  {avatarFile && (
                    <button
                      type="button"
                      onClick={onUploadAvatar}
                      disabled={avatarStatus === "uploading" || avatarStatus === "saving"}
                      className="mt-2 text-sm font-medium text-[#007AFF] disabled:opacity-50"
                    >
                      {avatarStatus === "uploading" ? "Envoi en cours..." : avatarStatus === "saving" ? "Sauvegarde..." : "Confirmer la nouvelle photo"}
                    </button>
                  )}
                </div>
              </div>

              {/* Section Informations de base */}
              <div className="mt-6 mx-4">
                <h2 className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide px-4 mb-2">Informations de base</h2>
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm divide-y divide-gray-100">
                  {/* Prénom */}
                  <div className="px-4 py-3.5">
                    <label className="block text-[13px] font-medium text-gray-500 mb-1">Prénom</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full text-[17px] text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 p-0 placeholder:text-gray-300"
                      placeholder="Entrez votre prénom"
                    />
                  </div>

                  {/* À propos */}
                  <div className="px-4 py-3.5">
                    <label className="block text-[13px] font-medium text-gray-500 mb-1">À propos de moi</label>
                    <textarea
                      value={publicAboutMe}
                      onChange={(e) => setPublicAboutMe(e.target.value)}
                      rows={3}
                      className="w-full text-[17px] text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 p-0 resize-none placeholder:text-gray-300"
                      placeholder="Décrivez-vous en quelques mots..."
                    />
                  </div>
                </div>
              </div>

              {/* Section Localisation */}
              <div className="mt-6 mx-4">
                <h2 className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide px-4 mb-2">Localisation</h2>
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm divide-y divide-gray-100">
                  {/* Ville avec autocomplétion */}
                  <div className="px-4 py-3.5">
                    <div className="flex items-center">
                      <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 relative">
                        <label className="block text-[13px] font-medium text-gray-500">Ville</label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => {
                            setCity(e.target.value);
                            setCitySearch(e.target.value);
                            setShowCitySuggestions(true);
                          }}
                          onFocus={() => setShowCitySuggestions(true)}
                          className="w-full text-[17px] text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 p-0 placeholder:text-gray-300"
                          placeholder="Rechercher une ville..."
                        />
                      </div>
                    </div>
                    {/* Suggestions de villes */}
                    {showCitySuggestions && citySuggestions.length > 0 && (
                      <div className="mt-2 bg-gray-50 rounded-xl overflow-hidden">
                        {citySuggestions.map((suggestion, index) => (
                          <button
                            key={suggestion.place_id || index}
                            type="button"
                            onClick={() => {
                              const cityName = suggestion.structured_formatting?.main_text || suggestion.description.split(",")[0];
                              setCity(cityName);
                              setShowCitySuggestions(false);
                              // Extraire le pays de la suggestion
                              const parts = suggestion.description.split(", ");
                              if (parts.length > 1) {
                                setProfileCountry(parts[parts.length - 1]);
                              }
                            }}
                            className="w-full px-3 py-2.5 text-left hover:bg-gray-100 flex items-center gap-2 transition-colors"
                          >
                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                            </svg>
                            <div>
                              <p className="text-[15px] text-gray-900">{suggestion.structured_formatting?.main_text || suggestion.description.split(",")[0]}</p>
                              <p className="text-[13px] text-gray-500">{suggestion.structured_formatting?.secondary_text || ""}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Pays avec liste déroulante */}
                  <div className="px-4 py-3.5">
                    <div className="flex items-center">
                      <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                        </svg>
                      </div>
                      <div className="flex-1 relative">
                        <label className="block text-[13px] font-medium text-gray-500">Pays</label>
                        <input
                          type="text"
                          value={profileCountry}
                          onChange={(e) => {
                            setProfileCountry(e.target.value);
                            setCountrySearch(e.target.value);
                            setShowCountrySuggestions(true);
                          }}
                          onFocus={() => setShowCountrySuggestions(true)}
                          className="w-full text-[17px] text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 p-0 placeholder:text-gray-300"
                          placeholder="Sélectionner un pays..."
                        />
                      </div>
                    </div>
                    {/* Suggestions de pays */}
                    {showCountrySuggestions && (
                      <div className="mt-2 bg-gray-50 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                        {COUNTRIES_LIST
                          .filter(c => c.toLowerCase().includes(countrySearch.toLowerCase()))
                          .slice(0, 8)
                          .map((country, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => {
                                setProfileCountry(country);
                                setShowCountrySuggestions(false);
                              }}
                              className="w-full px-3 py-2.5 text-left hover:bg-gray-100 flex items-center gap-2 transition-colors"
                            >
                              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582" />
                              </svg>
                              <span className="text-[15px] text-gray-900">{country}</span>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section Professionnel */}
              <div className="mt-6 mx-4">
                <h2 className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide px-4 mb-2">Professionnel</h2>
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-4 py-3.5 flex items-center">
                    <div className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <label className="block text-[13px] font-medium text-gray-500">Profession</label>
                      <input
                        type="text"
                        value={publicJobTitle}
                        onChange={(e) => setPublicJobTitle(e.target.value)}
                        className="w-full text-[17px] text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 p-0 placeholder:text-gray-300"
                        placeholder="Votre métier"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section Langues & Intérêts */}
              <div className="mt-6 mx-4">
                <h2 className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide px-4 mb-2">Langues & Intérêts</h2>
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm divide-y divide-gray-100">
                  {/* Langues */}
                  <div className="px-4 py-3.5 flex items-center">
                    <div className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <label className="block text-[13px] font-medium text-gray-500">Langues parlées</label>
                      <input
                        type="text"
                        value={publicLanguages}
                        onChange={(e) => setPublicLanguages(e.target.value)}
                        className="w-full text-[17px] text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 p-0 placeholder:text-gray-300"
                        placeholder="Français, Anglais..."
                      />
                    </div>
                  </div>

                  {/* Intérêts */}
                  <div className="px-4 py-3.5 flex items-center">
                    <div className="w-9 h-9 rounded-full bg-pink-50 flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <label className="block text-[13px] font-medium text-gray-500">Centres d'intérêt</label>
                      <input
                        type="text"
                        value={publicInterests}
                        onChange={(e) => setPublicInterests(e.target.value)}
                        className="w-full text-[17px] text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 p-0 placeholder:text-gray-300"
                        placeholder="Voyage, Musique, Sport..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Message de succès */}
              {status === "saved" && (
                <div className="mt-6 mx-4">
                  <div className="bg-green-50 rounded-2xl p-4 flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-[15px] font-medium text-green-700">Modifications enregistrées avec succès</p>
                  </div>
                </div>
              )}

              {/* Espace en bas */}
              <div className="h-6"></div>
            </div>
          </div>

          {/* DESKTOP: Modal centrée (garde l'ancien design) */}
          <section
            className="hidden lg:flex relative z-50 h-auto max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header fixe desktop */}
            <div className="flex items-center justify-between border-b border-gray-100 p-6">
              <h3 className="text-base font-semibold">
                {t.photoAndInfo}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsEditingProfile(false);
                  window.history.pushState({}, '', '/account');
                }}
                className="text-sm text-gray-500 hover:text-black"
              >
                {t.close}
              </button>
            </div>

            {/* Contenu scrollable desktop */}
            <div className="flex-1 overflow-y-auto p-6 pb-8 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300">

            {/* Avatar + input fichier custom */}
            <div className="mb-4 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <div className="relative h-16 w-16 overflow-hidden rounded-full bg-gray-200">
                {avatarPreview ? (
                  <Image
                    src={avatarPreview}
                    alt="avatar"
                    fill
                    className="object-cover"
                    sizes="64px"
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

            {/* Message de confidentialité */}
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
              <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <span>{t.privateInfoNote}</span>
            </div>

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
                    onClick={() => {
                      // Rediriger vers le support avec message automatique pour changement d'email
                      window.location.href = "/messages?support=true&autoMessage=changement%20d%27adresse%20mail";
                    }}
                    className="text-sm font-medium text-gray-700 hover:underline"
                  >
                    {t.contactSupport}
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
            </div>
          </section>
        </div>
      )}

      {/* 🔥 MODAL INFOS PUBLIQUES (travail, langues, description, centres d'intérêt) */}
      {isEditingPublic && (
        <div className="fixed inset-0 z-40 flex items-end lg:items-center justify-center p-0 lg:p-4 lg:pb-8 lg:pt-12">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsEditingPublic(false)}
          />
          <section
            className="relative z-50 flex h-full lg:h-auto lg:max-h-[80vh] w-full lg:max-w-xl flex-col overflow-hidden rounded-t-3xl lg:rounded-3xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header fixe */}
            <div className="flex items-center justify-between border-b border-gray-100 p-4 sm:p-6">
              <h3 className="text-base font-semibold">
                {t.editPublicInfoTitle}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingPublic(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 lg:bg-transparent lg:h-auto lg:w-auto text-gray-500 hover:text-black"
              >
                <svg className="h-5 w-5 lg:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="hidden lg:inline text-sm">{t.close}</span>
              </button>
            </div>

            {/* Contenu scrollable */}
            <div className="flex-1 overflow-y-auto p-4 pb-6 sm:p-6 sm:pb-8 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:mr-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:my-6 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
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
            </div>
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
      <section className="rounded-2xl lg:rounded-3xl border-0 lg:border border-gray-200 bg-white p-4 lg:p-6 text-sm text-gray-600 shadow-sm">
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      </section>
    );
  }

  if (!trips.length) {
    return (
      <section className="rounded-2xl lg:rounded-3xl border-0 lg:border border-gray-200 bg-white p-4 lg:p-6 text-sm text-gray-600 shadow-sm">
        <h3 className="hidden lg:block mb-2 text-base font-semibold">{t.previousTrips}</h3>
        <div className="flex flex-col items-center py-8 lg:py-4 text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
            </svg>
          </div>
          <p className="text-gray-500">{t.noTripsYet}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h3 className="hidden lg:block text-base font-semibold">{t.previousTrips}</h3>
      <div className="grid gap-3 lg:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {trips.map((booking) => (
          <article
            key={booking.id}
            className="overflow-hidden rounded-2xl border-0 lg:border border-gray-200 bg-white shadow-sm"
          >
            {booking.listing.coverImageUrl && (
              <div className="relative h-36 lg:h-40 w-full">
                <Image
                  src={booking.listing.coverImageUrl}
                  alt={booking.listing.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="space-y-1 p-3 lg:p-4 text-sm">
              <div className="font-medium text-gray-900">{booking.listing.title}</div>
              <div className="text-gray-500 text-xs lg:text-sm">
                {new Date(booking.startDate).toLocaleDateString()} –{" "}
                {new Date(booking.endDate).toLocaleDateString()}
              </div>
              <div className="text-gray-500 text-xs lg:text-sm">
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

/* ===========================
   Vue Profil PUBLIC (mode preview)
   =========================== */

type PublicProfileViewProps = {
  user: UserDTO | null;
  fullName: string;
  cityLine: string;
  memberSinceYear: number | null;
  avatarPreview: string | null;
  trips: BookingDTO[];
  tripsLoading: boolean;
  router: ReturnType<typeof useRouter>;
  t: ProfileTranslations;
};

function PublicProfileView({
  user,
  fullName,
  cityLine,
  memberSinceYear,
  avatarPreview,
  trips,
  tripsLoading,
  router,
  t,
}: PublicProfileViewProps) {
  const profile = user?.profile;
  const reviewsCount = profile?.ratingCount ?? 0;
  const rating = typeof profile?.ratingAvg === "number" ? profile.ratingAvg.toFixed(1) : null;

  // Verifications simulees (a adapter selon les donnees reelles)
  const hasIdentityVerified = true; // placeholder
  const hasEmailVerified = !!user?.email;
  const hasPhoneVerified = !!profile?.phone;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header avec bouton retour */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between lg:hidden">
        <button
          type="button"
          onClick={() => router.push("/account")}
          className="flex items-center gap-2 text-sm font-medium text-gray-900"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Retour
        </button>
        <span className="text-sm text-gray-500">Aperçu du profil</span>
        <div className="w-16" />
      </div>

      {/* Desktop header */}
      <div className="hidden lg:block bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <button
            type="button"
            onClick={() => router.push("/account")}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Retour aux paramètres
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 lg:px-6 py-6 lg:py-10">
        {/* Section principale du profil */}
        <div className="bg-white rounded-2xl lg:rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {/* En-tete du profil */}
          <div className="px-6 py-8 lg:py-10 text-center border-b border-gray-100">
            {/* Avatar */}
            <div className="flex justify-center mb-4">
              <div className="relative h-28 w-28 lg:h-32 lg:w-32 overflow-hidden rounded-full bg-gray-200 ring-4 ring-white shadow-lg">
                {avatarPreview ? (
                  <Image
                    src={avatarPreview}
                    alt={fullName}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-4xl font-semibold text-gray-600">
                    {fullName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            {/* Nom */}
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{fullName}</h1>

            {/* Localisation */}
            {cityLine && cityLine !== t.completeProfile && (
              <p className="mt-2 text-sm lg:text-base text-gray-500">{cityLine}</p>
            )}
          </div>

          {/* Section Verifications */}
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Vérifications</h2>
            <div className="space-y-2">
              {hasIdentityVerified && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Identité vérifiée</span>
                </div>
              )}
              {hasEmailVerified && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Email vérifié</span>
                </div>
              )}
              {hasPhoneVerified && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Numéro vérifié</span>
                </div>
              )}
            </div>
          </div>

          {/* Section A propos */}
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">À propos de {fullName.split(' ')[0]}</h2>

            <div className="space-y-4">
              {/* Description */}
              {profile?.aboutMe && (
                <div>
                  <p className="text-sm text-gray-700 leading-relaxed">"{profile.aboutMe}"</p>
                </div>
              )}

              {/* Langues */}
              {profile?.languages && (
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
                  </svg>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Parle</p>
                    <p className="text-sm text-gray-900">{profile.languages}</p>
                  </div>
                </div>
              )}

              {/* Lieu de residence */}
              {(profile?.city || profile?.country) && (
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Habite à</p>
                    <p className="text-sm text-gray-900">
                      {profile.city}{profile.city && profile.country ? ", " : ""}{profile.country}
                    </p>
                  </div>
                </div>
              )}

              {/* Travail */}
              {profile?.jobTitle && (
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
                  </svg>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Travaille</p>
                    <p className="text-sm text-gray-900">{profile.jobTitle}</p>
                  </div>
                </div>
              )}

              {/* Membre depuis */}
              {memberSinceYear && (
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Membre depuis</p>
                    <p className="text-sm text-gray-900">{memberSinceYear}</p>
                  </div>
                </div>
              )}

              {/* Message si aucune info */}
              {!profile?.aboutMe && !profile?.languages && !profile?.city && !profile?.jobTitle && !profile?.interests && (
                <p className="text-sm text-gray-400 italic">Aucune information renseignée pour le moment.</p>
              )}

              {/* Centres d'intérêt */}
              {profile?.interests && (
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Centres d'intérêt</p>
                    <p className="text-sm text-gray-900">{profile.interests}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section Avis */}
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">Avis ({reviewsCount})</h2>
              {rating && (
                <div className="flex items-center gap-1">
                  <svg className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-900">{rating}</span>
                </div>
              )}
            </div>

            {reviewsCount > 0 ? (
              <div className="space-y-4">
                {/* Placeholder pour les avis - a remplacer par les vrais avis */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm text-gray-700">"Super expérience, je recommande !"</p>
                  <p className="mt-2 text-xs text-gray-500">Utilisateur - Janvier 2024</p>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <svg className="h-10 w-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
                <p className="text-sm text-gray-500">Aucun avis pour l'instant</p>
              </div>
            )}
          </div>

          {/* Section Voyages confirmés */}
          <div className="px-6 py-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Voyages confirmés</h2>
            {tripsLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
              </div>
            ) : (
              <p className="text-sm text-gray-700">
                {trips.length} {trips.length === 1 ? "voyage" : "voyages"}
              </p>
            )}
          </div>
        </div>

        {/* Note en bas */}
        <p className="mt-6 text-center text-xs text-gray-400">
          Ceci est un aperçu de votre profil public tel que les autres utilisateurs le voient.
        </p>
      </div>
    </main>
  );
}

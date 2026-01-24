"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, FormEvent } from "react";
import Image from "next/image";
import { signIn, useSession } from "next-auth/react";
import { UserMenu } from "./layout/UserMenu";
import { useSearchBarSafe } from "@/contexts/SearchBarContext";
import { COUNTRIES, DEFAULT_COUNTRY, type Country } from "@/data/countries";
import NotificationBell from "./NotificationBell";
import CategoryIcon from "./CategoryIcon";

type LocaleOption = {
  code: string;
  label: string;
};

type CurrencyOption = {
  code: string;
  label: string;
  symbol: string;
};

const LOCALES: LocaleOption[] = [
  { code: "fr", label: "Français" },
  { code: "en", label: "Anglais" },
  { code: "es", label: "Espagnol" },
  { code: "de", label: "Allemand" },
  { code: "it", label: "Italien" },
  { code: "pt", label: "Portugais" },
  { code: "zh", label: "Chinois" },
];

type LocaleCode = (typeof LOCALES)[number]["code"];

const CURRENCIES: CurrencyOption[] = [
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "USD", label: "Dollar américain", symbol: "$" },
  { code: "CAD", label: "Dollar canadien", symbol: "$" },
  { code: "CNY", label: "Yuan chinois", symbol: "¥" },
  { code: "GBP", label: "Livre", symbol: "£" },
];

// Mapping devise -> symbole pour l'affichage compact
const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: "€",
  USD: "$",
  CAD: "$",
  CNY: "¥",
  GBP: "£",
};

type NavTexts = {
  navListings: string;
  navBookings: string;
  navProfile: string;
  hostMode: string;
  travelerMode: string;
  becomeHost: string;
  createListing: string;
  loginCta: string;

  modalTitle: string;
  modalLanguage: string;
  modalCurrency: string;

  authTitle: string;
  authWelcome: string;
  phoneCountryLabel: string;
  phoneNumberLabel: string;
  phoneHint: string;
  phoneContinue: string;
  or: string;
  continueGoogle: string;
  continueApple: string;
  continueEmail: string;
  continueFacebook: string;
  authLegal: string;
};

const NAV_TEXTS: Record<LocaleCode, NavTexts> = {
  fr: {
    navListings: "Annonces",
    navBookings: "Réservations",
    navProfile: "Profil",
    hostMode: "Mode hôte",
    travelerMode: "Passer en mode voyageur",
    becomeHost: "Devenir hôte Lok'Room",
    createListing: "Créer une annonce",
    loginCta: "Connexion / Inscription",
    modalTitle: "Langues et devises Lok’Room",
    modalLanguage: "Langue",
    modalCurrency: "Devise",
    authTitle: "Connexion ou inscription",
    authWelcome: "Bienvenue sur Lok’Room",
    phoneCountryLabel: "Pays/région",
    phoneNumberLabel: "Numéro de téléphone",
    phoneHint:
      "Nous pourrons vous appeler ou vous envoyer un SMS pour confirmer votre numéro. Des frais de messagerie et de données peuvent s'appliquer.",
    phoneContinue: "Continuer",
    or: "ou",
    continueGoogle: "Continuer avec Google",
    continueApple: "Continuer avec Apple",
    continueEmail: "Continuer avec l'adresse e-mail",
    continueFacebook: "Continuer avec Facebook",
    authLegal:
      "En continuant, vous confirmez avoir lu et accepté les Conditions générales et la Politique de confidentialité de Lok'Room.",
  },
  en: {
    navListings: "Listings",
    navBookings: "Trips",
    navProfile: "Profile",
    hostMode: "Host mode",
    travelerMode: "Switch to guest mode",
    becomeHost: "Become a Lok'Room host",
    createListing: "Create a listing",
    loginCta: "Log in / Sign up",
    modalTitle: "Lok’Room languages & currencies",
    modalLanguage: "Language",
    modalCurrency: "Currency",
    authTitle: "Log in or sign up",
    authWelcome: "Welcome to Lok’Room",
    phoneCountryLabel: "Country/region",
    phoneNumberLabel: "Phone number",
    phoneHint:
      "We may call or text you to confirm your number. Message and data rates may apply.",
    phoneContinue: "Continue",
    or: "or",
    continueGoogle: "Continue with Google",
    continueApple: "Continue with Apple",
    continueEmail: "Continue with e-mail",
    continueFacebook: "Continue with Facebook",
    authLegal:
      "By continuing, you confirm that you’ve read and accepted Lok’Room’s Terms and Privacy Policy.",
  },
  es: {
    navListings: "Anuncios",
    navBookings: "Viajes",
    navProfile: "Perfil",
    hostMode: "Modo anfitrión",
    travelerMode: "Cambiar a modo viajero",
    becomeHost: "Conviértete en anfitrión Lok'Room",
    createListing: "Crear un anuncio",
    loginCta: "Iniciar sesión / Registrarse",
    modalTitle: "Idiomas y divisas de Lok’Room",
    modalLanguage: "Idioma",
    modalCurrency: "Divisa",
    authTitle: "Inicia sesión o regístrate",
    authWelcome: "Bienvenido a Lok’Room",
    phoneCountryLabel: "País/región",
    phoneNumberLabel: "Número de teléfono",
    phoneHint:
      "Podemos llamarte o enviarte un SMS para confirmar tu número. Pueden aplicarse tarifas de mensajes y datos.",
    phoneContinue: "Continuar",
    or: "o",
    continueGoogle: "Continuar con Google",
    continueApple: "Continuar con Apple",
    continueEmail: "Continuar con el correo electrónico",
    continueFacebook: "Continuar con Facebook",
    authLegal:
      "Al continuar, confirmas que has leído y aceptado las Condiciones y la Política de privacidad de Lok’Room.",
  },
  de: {
    navListings: "Inserate",
    navBookings: "Reisen",
    navProfile: "Profil",
    hostMode: "Gastgebermodus",
    travelerMode: "In den Gastmodus wechseln",
    becomeHost: "Lok'Room-Gastgeber werden",
    createListing: "Inserat erstellen",
    loginCta: "Anmelden / Registrieren",
    modalTitle: "Lok’Room Sprachen & Währungen",
    modalLanguage: "Sprache",
    modalCurrency: "Währung",
    authTitle: "Anmelden oder registrieren",
    authWelcome: "Willkommen bei Lok’Room",
    phoneCountryLabel: "Land/Region",
    phoneNumberLabel: "Telefonnummer",
    phoneHint:
      "Wir können dich anrufen oder dir eine SMS senden, um deine Nummer zu bestätigen. Es können Gebühren für Nachrichten und Daten anfallen.",
    phoneContinue: "Weiter",
    or: "oder",
    continueGoogle: "Mit Google fortfahren",
    continueApple: "Mit Apple fortfahren",
    continueEmail: "Mit E-Mail fortfahren",
    continueFacebook: "Mit Facebook fortfahren",
    authLegal:
      "Indem du fortfährst, bestätigst du, dass du die AGB und die Datenschutzrichtlinie von Lok’Room gelesen und akzeptiert hast.",
  },
  it: {
    navListings: "Annunci",
    navBookings: "Viaggi",
    navProfile: "Profilo",
    hostMode: "Modalità host",
    travelerMode: "Passa alla modalità ospite",
    becomeHost: "Diventa host Lok'Room",
    createListing: "Crea un annuncio",
    loginCta: "Accedi / Registrati",
    modalTitle: "Lingue e valute Lok’Room",
    modalLanguage: "Lingua",
    modalCurrency: "Valuta",
    authTitle: "Accedi o registrati",
    authWelcome: "Benvenuto su Lok’Room",
    phoneCountryLabel: "Paese/regione",
    phoneNumberLabel: "Numero di telefono",
    phoneHint:
      "Potremmo chiamarti o inviarti un SMS per confermare il tuo numero. Possono essere applicati costi per messaggi e dati.",
    phoneContinue: "Continua",
    or: "oppure",
    continueGoogle: "Continua con Google",
    continueApple: "Continua con Apple",
    continueEmail: "Continua con e-mail",
    continueFacebook: "Continua con Facebook",
    authLegal:
      "Continuando, confermi di aver letto e accettato i Termini e l’Informativa sulla privacy di Lok’Room.",
  },
  pt: {
    navListings: "Anúncios",
    navBookings: "Viagens",
    navProfile: "Perfil",
    hostMode: "Modo anfitrião",
    travelerMode: "Mudar para modo hóspede",
    becomeHost: "Tornar-se anfitrião Lok'Room",
    createListing: "Criar um anúncio",
    loginCta: "Entrar / Cadastrar-se",
    modalTitle: "Idiomas e moedas Lok’Room",
    modalLanguage: "Idioma",
    modalCurrency: "Moeda",
    authTitle: "Entrar ou cadastrar-se",
    authWelcome: "Bem-vindo ao Lok’Room",
    phoneCountryLabel: "País/região",
    phoneNumberLabel: "Número de telefone",
    phoneHint:
      "Podemos ligar ou enviar um SMS para confirmar o seu número. Podem ser cobradas tarifas de mensagens e dados.",
    phoneContinue: "Continuar",
    or: "ou",
    continueGoogle: "Continuar com Google",
    continueApple: "Continuar com Apple",
    continueEmail: "Continuar com e-mail",
    continueFacebook: "Continuar com Facebook",
    authLegal:
      "Ao continuar, você confirma que leu e aceitou os Termos e a Política de privacidade do Lok’Room.",
  },
  zh: {
    navListings: "房源",
    navBookings: "行程",
    navProfile: "个人资料",
    hostMode: "房东模式",
    travelerMode: "切换到房客模式",
    becomeHost: "成为 Lok'Room 房东",
    createListing: "创建房源",
    loginCta: "登录 / 注册",
    modalTitle: "Lok’Room 语言和货币",
    modalLanguage: "语言",
    modalCurrency: "货币",
    authTitle: "登录或注册",
    authWelcome: "欢迎来到 Lok’Room",
    phoneCountryLabel: "国家/地区",
    phoneNumberLabel: "电话号码",
    phoneHint:
      "我们可能会给你打电话或发送短信以确认你的号码。可能会产生短信和流量费用。",
    phoneContinue: "继续",
    or: "或",
    continueGoogle: "使用 Google 继续",
    continueApple: "使用 Apple 继续",
    continueEmail: "使用邮箱继续",
    continueFacebook: "使用 Facebook 继续",
    authLegal:
      "继续操作即表示你已阅读并接受 Lok'Room 的条款和隐私政策。",
  },
};

/**
 * 🔁 VERSION MODIFIÉE
 * - lit d'abord le cookie `locale`
 * - puis, seulement si rien, utilise <html lang> / data-locale
 */
function getClientLocale(): LocaleCode {
  if (typeof document === "undefined") return "fr";

  const allowed = ["fr", "en", "es", "de", "it", "pt", "zh"];

  // 1️⃣ priorité au cookie
  const mLoc = document.cookie.match(/(?:^|;\s*)locale=([^;]+)/);
  if (mLoc?.[1] && allowed.includes(mLoc[1])) {
    return mLoc[1] as LocaleCode;
  }

  // 2️⃣ fallback sur les attributs du <html>
  const fromHtml =
    document.documentElement.getAttribute("data-locale") ||
    document.documentElement.lang;

  if (fromHtml && allowed.includes(fromHtml)) {
    return fromHtml as LocaleCode;
  }

  // 3️⃣ fallback final
  return "fr";
}

type SessionUser = {
  role?: "HOST" | "GUEST" | "BOTH" | "ADMIN";
  isHost?: boolean;
};

// Labels pour toutes les catégories
const CATEGORY_LABELS: Record<string, string> = {
  HOUSE: "Maison",
  APARTMENT: "Appartement",
  PARKING: "Parking",
  ROOM: "Chambre",
  GARAGE: "Garage",
  STORAGE: "Stockage",
  OFFICE: "Bureau",
  MEETING_ROOM: "Salle de réunion",
  COWORKING: "Coworking",
  EVENT_SPACE: "Événementiel",
  RECORDING_STUDIO: "Studios",
  OTHER: "Autre",
};

// Ordre des catégories
const CATEGORY_ORDER = [
  "HOUSE", "APARTMENT", "PARKING", "ROOM", "GARAGE", "STORAGE",
  "OFFICE", "MEETING_ROOM", "COWORKING", "EVENT_SPACE", "RECORDING_STUDIO", "OTHER"
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [animatingCategory, setAnimatingCategory] = useState<string | null>(null);

  const [localeModalOpen, setLocaleModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authPhoneNumber, setAuthPhoneNumber] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<Country>(DEFAULT_COUNTRY);

  const [currentLocale, setCurrentLocale] = useState<LocaleCode>("fr");
  const [currentCurrency, setCurrentCurrency] = useState<string>("EUR");

  // Récupérer les catégories et l'état du scroll depuis le contexte
  const searchBarContext = useSearchBarSafe();
  const showSearchBar = searchBarContext?.showInNavbar || false;
  const activeCategory = searchBarContext?.activeCategory || null;
  const setActiveCategory = searchBarContext?.setActiveCategory || (() => {});

  // Créer la liste complète des catégories triées
  const sortedCategories = CATEGORY_ORDER.map(key => ({
    key,
    label: CATEGORY_LABELS[key] || key,
  }));

  const { data: session, status } = useSession();
  const typedUser = session?.user as SessionUser | undefined;

  const isLoggedIn = status === "authenticated";
  const userRole = typedUser?.role ?? "GUEST";

  const isHost =
    typedUser?.isHost || userRole === "HOST" || userRole === "BOTH" || userRole === "ADMIN";


  // Fermer le menu mobile quand on change de page
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Écouter l'événement pour ouvrir le modal langue/devise depuis le UserMenu
  useEffect(() => {
    function handleOpenLocaleModal() {
      setLocaleModalOpen(true);
    }
    window.addEventListener("openLocaleModal", handleOpenLocaleModal);
    return () => window.removeEventListener("openLocaleModal", handleOpenLocaleModal);
  }, []);

  // Initialise locale + currency à partir du DOM / cookies
  useEffect(() => {
    if (typeof document === "undefined") return;

    const initialLocale = getClientLocale();
    setCurrentLocale(initialLocale);

    const mCur = document.cookie.match(/(?:^|;\s*)currency=([^;]+)/);
    if (mCur?.[1]) {
      setCurrentCurrency(mCur[1]);
    }
  }, []);

  const router = useRouter();
  const t = NAV_TEXTS[currentLocale] ?? NAV_TEXTS.fr;

  function setLocale(code: LocaleCode) {
    setCurrentLocale(code);
    if (typeof document !== "undefined") {
      document.cookie = `locale=${code}; path=/; max-age=31536000`;
      document.documentElement.lang = code;
      document.documentElement.setAttribute("data-locale", code);
      router.refresh();
    }
    setLocaleModalOpen(false);
  }

  function setCurrency(code: string) {
    setCurrentCurrency(code);
    if (typeof document !== "undefined") {
      document.cookie = `currency=${code}; path=/; max-age=31536000`;
      router.refresh();
    }
    setLocaleModalOpen(false);
  }

  function handlePhoneSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    alert("La connexion par téléphone sera bientôt disponible sur Lok'Room.");
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-neutral-50">
        <div className="relative flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 sm:py-5 max-w-[1760px] 3xl:max-w-[2200px] 4xl:max-w-[2800px] mx-auto">
          {/* Logo à gauche */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/logo.svg"
              alt="Lok'Room"
              width={130}
              height={85}
              className="h-7 sm:h-8 lg:h-9 w-auto"
              priority
              unoptimized
            />
          </Link>

          {/* Centre : Recherche (visible quand scrollé sur la page d'accueil uniquement) */}
          <div className={`hidden xl:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center z-20 transition-all duration-500 ease-out ${showSearchBar && pathname === "/" ? "opacity-100" : "opacity-0 -translate-y-4 pointer-events-none"}`}>
            {/* Container pour Tous + Recherche */}
            <div className="flex items-center gap-2">
              {/* Bouton Tous avec catégories qui se déploient à gauche */}
              <div className="relative flex items-center">
                {/* Catégories qui se déploient à gauche (position absolue, aligné avec Tous) */}
                <div
                  className={`absolute right-full mr-2 top-1/2 -translate-y-1/2 transition-all duration-300 ease-out ${
                    categoriesOpen
                      ? "opacity-100 translate-x-0"
                      : "opacity-0 translate-x-4 pointer-events-none"
                  }`}
                >
                  {/* Container ovale horizontal avec scrollbar intégrée */}
                  <div className="rounded-full border border-gray-200 bg-white shadow-md overflow-hidden max-w-[300px]">
                    {/* Zone des catégories scrollable */}
                    <div
                      id="navbar-categories-scroll"
                      className="flex items-center px-2 pt-1 pb-0.5 overflow-x-auto scrollbar-navbar-categories"
                      onScroll={(e) => {
                        const target = e.target as HTMLDivElement;
                        const thumb = document.getElementById('navbar-custom-scrollbar-thumb');
                        const track = document.getElementById('navbar-custom-scrollbar-track');
                        if (thumb && track && target.scrollWidth > target.clientWidth) {
                          const scrollPercent = target.scrollLeft / (target.scrollWidth - target.clientWidth);
                          const trackWidth = track.offsetWidth;
                          const thumbWidth = thumb.offsetWidth;
                          const maxLeft = trackWidth - thumbWidth;
                          thumb.style.left = `${scrollPercent * maxLeft}px`;
                        }
                      }}
                    >
                      {sortedCategories.map((cat, index) => (
                        <button
                          key={cat.key}
                          onClick={() => {
                            if (activeCategory !== cat.key) {
                              setAnimatingCategory(cat.key);
                              setTimeout(() => setAnimatingCategory(null), 2000);
                            }
                            setActiveCategory(activeCategory === cat.key ? null : cat.key);
                          }}
                          className={`group flex items-center gap-1.5 px-2 py-1 rounded-full transition-all duration-200 flex-shrink-0 ${
                            activeCategory === cat.key
                              ? "bg-gray-100 text-gray-900"
                              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                          }`}
                          style={{
                            transitionDelay: categoriesOpen ? `${index * 30}ms` : '0ms',
                          }}
                        >
                          <div className="scale-[0.6]">
                            <CategoryIcon
                              category={cat.key}
                              isActive={activeCategory === cat.key}
                              isAnimating={animatingCategory === cat.key}
                            />
                          </div>
                          <span className={`text-[10px] font-medium whitespace-nowrap ${
                            activeCategory === cat.key ? "text-gray-900" : "text-gray-600"
                          }`}>{cat.label}</span>
                        </button>
                      ))}
                    </div>
                    {/* Custom scrollbar intégrée en bas de la bulle */}
                    <div
                      id="navbar-custom-scrollbar-track"
                      className="mx-3 mb-1.5 h-1 bg-gray-100 rounded-full relative cursor-pointer"
                      onClick={(e) => {
                        const track = e.currentTarget;
                        const rect = track.getBoundingClientRect();
                        const clickX = e.clientX - rect.left;
                        const trackWidth = track.offsetWidth;
                        const thumb = document.getElementById('navbar-custom-scrollbar-thumb');
                        const thumbWidth = thumb ? thumb.offsetWidth : 50;
                        const scrollContainer = document.getElementById('navbar-categories-scroll');
                        if (scrollContainer) {
                          const scrollPercent = Math.max(0, Math.min(1, (clickX - thumbWidth / 2) / (trackWidth - thumbWidth)));
                          const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;
                          scrollContainer.scrollLeft = scrollPercent * maxScroll;
                        }
                      }}
                    >
                      <div
                        id="navbar-custom-scrollbar-thumb"
                        className="absolute top-0 left-0 h-1 w-[50px] bg-gray-300 rounded-full cursor-grab hover:bg-gray-400 active:cursor-grabbing active:bg-gray-500 transition-colors"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          const thumb = e.currentTarget;
                          const track = document.getElementById('navbar-custom-scrollbar-track');
                          const scrollContainer = document.getElementById('navbar-categories-scroll');
                          if (!track || !scrollContainer) return;

                          const trackRect = track.getBoundingClientRect();
                          const thumbRect = thumb.getBoundingClientRect();
                          const startX = e.clientX;
                          const startLeft = thumbRect.left - trackRect.left;
                          const trackWidth = track.offsetWidth;
                          const thumbWidth = thumb.offsetWidth;
                          const maxLeft = trackWidth - thumbWidth;

                          const onMouseMove = (moveEvent: MouseEvent) => {
                            const deltaX = moveEvent.clientX - startX;
                            const newLeft = Math.max(0, Math.min(maxLeft, startLeft + deltaX));
                            thumb.style.left = `${newLeft}px`;
                            const scrollPercent = newLeft / maxLeft;
                            const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;
                            scrollContainer.scrollLeft = scrollPercent * maxScroll;
                          };

                          const onMouseUp = () => {
                            document.removeEventListener('mousemove', onMouseMove);
                            document.removeEventListener('mouseup', onMouseUp);
                          };

                          document.addEventListener('mousemove', onMouseMove);
                          document.addEventListener('mouseup', onMouseUp);
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bouton Tous (position fixe) */}
                <button
                  type="button"
                  onClick={() => setCategoriesOpen(!categoriesOpen)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full border bg-white shadow-sm transition-all duration-300 group ${
                    categoriesOpen
                      ? "border-gray-400 shadow-md"
                      : "border-gray-300 hover:shadow-md hover:border-gray-400"
                  }`}
                >
                  <div className={`transition-transform duration-300 ${categoriesOpen ? "rotate-45 scale-110" : "group-hover:scale-110"}`}>
                    <svg className="h-3.5 w-3.5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" />
                      <rect x="14" y="14" width="7" height="7" rx="1" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Tous</span>
                </button>
              </div>

              {/* Barre de recherche compacte */}
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    if (window.location.pathname === "/") {
                      window.dispatchEvent(new CustomEvent("openSearchModal"));
                    } else {
                      window.location.href = "/?search=open";
                    }
                  }
                }}
                className="flex items-center rounded-full border border-gray-300 bg-white shadow-sm hover:shadow-md transition-all duration-200 py-2 px-2"
              >
                <div className="px-3 border-r border-gray-200 text-left">
                  <p className="text-sm font-medium text-gray-900">Destination</p>
                </div>
                <div className="px-3 border-r border-gray-200 text-left hidden xl:block">
                  <p className="text-sm font-medium text-gray-900">Dates</p>
                </div>
                <div className="px-3 text-left hidden 2xl:block">
                  <p className="text-sm text-gray-500">Voyageurs</p>
                </div>
                <div className="flex items-center justify-center h-7 w-7 rounded-full bg-gray-900 ml-1">
                  <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </div>
              </button>
            </div>
          </div>

          {/* Menu à droite */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2 flex-shrink-0">
            {/* Lien Favoris - toujours visible si connecté */}
            {isLoggedIn && (
              <Link
                href="/wishlists"
                className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-full transition-all group"
              >
                <svg
                  className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
                  viewBox="0 0 32 32"
                  fill="none"
                >
                  <path
                    d="M16 28C7 23.27 2 18 2 11a6.98 6.98 0 0 1 7-7c1.8 0 3.58.68 4.95 2.05L16 8.1l2.05-2.05a6.98 6.98 0 0 1 9.9 0A6.98 6.98 0 0 1 30 11c0 7-5 12.27-14 17z"
                    className="fill-transparent stroke-gray-600 group-hover:stroke-[#FF385C] transition-colors duration-200"
                    strokeWidth="2"
                  />
                </svg>
                <span className="group-hover:text-gray-900 transition-colors duration-200">Favoris</span>
              </Link>
            )}

            {/* Bouton unique : texte change selon statut hôte */}
            <Link
              href="/listings/new"
              className="hidden lg:block px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 rounded-full transition-colors whitespace-nowrap"
            >
              {isHost ? t.createListing : t.becomeHost}
            </Link>

            {/* Cloche de notifications */}
            {isLoggedIn && <NotificationBell />}

            {/* Menu utilisateur avec hamburger + profil */}
            {isLoggedIn ? (
              <UserMenu />
            ) : (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-3 rounded-full border border-gray-300 bg-white pl-3.5 pr-2 py-2 hover:shadow-md transition-shadow"
              >
                {/* Icône hamburger (3 barres) */}
                <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                {/* Icône profil */}
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-500">
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
              </button>
            )}
          </div>

          {/* Burger mobile - REMPLACÉ par bouton Utiliser l'appli */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={() => {
                // Détecter iOS ou Android et rediriger vers le bon store
                const userAgent = navigator.userAgent.toLowerCase();
                if (/iphone|ipad|ipod/.test(userAgent)) {
                  window.location.href = "https://apps.apple.com/app/lokroom/id123456789";
                } else {
                  window.location.href = "https://play.google.com/store/apps/details?id=com.lokroom.app";
                }
              }}
              className="bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
            >
              Utiliser l'appli
            </button>
          </div>
        </div>

      </header>

      {/* MODAL LANGUE / DEVISE */}
      {localeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
          <div className="max-h-[90vh] sm:max-h-[85vh] w-full sm:max-w-xl md:max-w-2xl lg:max-w-4xl overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white p-4 sm:p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-semibold">
                {t.modalTitle}
              </h2>
              <button
                type="button"
                onClick={() => setLocaleModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-4 sm:gap-6 md:gap-8 md:grid-cols-2">
              {/* Langues */}
              <div>
                <h3 className="mb-3 text-xs sm:text-sm font-semibold uppercase tracking-wide text-gray-500">
                  {t.modalLanguage}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {LOCALES.map((loc) => (
                    <button
                      key={loc.code}
                      type="button"
                      onClick={() => setLocale(loc.code as LocaleCode)}
                      className={`flex flex-col items-start rounded-xl border px-3 py-2 text-left text-sm hover:border-gray-900 hover:bg-gray-50 ${
                        currentLocale === loc.code
                          ? "border-gray-900 bg-gray-50"
                          : "border-gray-200"
                      }`}
                    >
                      <span className="font-medium truncate w-full">{loc.label}</span>
                      <span className="text-xs uppercase text-gray-500">
                        {loc.code}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Devises */}
              <div>
                <h3 className="mb-3 text-xs sm:text-sm font-semibold uppercase tracking-wide text-gray-500">
                  {t.modalCurrency}
                </h3>
                <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-2">
                  {CURRENCIES.map((cur) => (
                    <button
                      key={cur.code}
                      type="button"
                      onClick={() => setCurrency(cur.code)}
                      className={`flex flex-col items-start rounded-xl border px-3 py-2 text-left text-sm hover:border-gray-900 hover:bg-gray-50 ${
                        currentCurrency === cur.code
                          ? "border-gray-900 bg-gray-50"
                          : "border-gray-200"
                      }`}
                    >
                      <span className="font-medium truncate w-full">
                        {cur.label} ({cur.symbol})
                      </span>
                      <span className="text-xs uppercase text-gray-500">
                        {cur.code}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONNEXION / INSCRIPTION */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
          <div className="flex max-h-[95vh] sm:max-h-[90vh] w-full sm:max-w-md md:max-w-lg flex-col rounded-t-2xl sm:rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-4 sm:px-6 py-3 sm:py-4">
              <button
                type="button"
                onClick={() => setAuthModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
                aria-label="Fermer"
              >
                ✕
              </button>
              <h2 className="text-sm font-semibold">
                {t.authTitle}
              </h2>
              <span className="w-8" />
            </div>

            <div className="auth-scroll flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5">
              <h3 className="mb-4 text-lg sm:text-xl font-semibold">
                {t.authWelcome}
              </h3>

              <form onSubmit={handlePhoneSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">
                    {t.phoneCountryLabel}
                  </label>
                  <select
                    value={selectedCountry.code}
                    onChange={(e) => {
                      const country = COUNTRIES.find(c => c.code === e.target.value);
                      if (country) {
                        setSelectedCountry(country);
                        // Auto-remplir l'indicatif dans le champ téléphone
                        setAuthPhoneNumber(country.dialCode);
                      }
                    }}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-0"
                  >
                    {COUNTRIES.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.flag} {country.name} ({country.dialCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">
                    {t.phoneNumberLabel}
                  </label>
                  <input
                    type="tel"
                    value={authPhoneNumber}
                    onChange={(e) => {
                      // N'accepter que les chiffres et le + (pour l'indicatif international)
                      const value = e.target.value.replace(/[^0-9+]/g, '');
                      // Le + ne peut être qu'au début
                      const sanitized = value.charAt(0) === '+'
                        ? '+' + value.slice(1).replace(/\+/g, '')
                        : value.replace(/\+/g, '');
                      setAuthPhoneNumber(sanitized);
                    }}
                    onKeyDown={(e) => {
                      // Bloquer les lettres et caractères spéciaux (sauf + au début)
                      const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
                      if (allowedKeys.includes(e.key)) return;
                      if (e.key === '+' && e.currentTarget.selectionStart === 0 && !authPhoneNumber.includes('+')) return;
                      if (!/[0-9]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-0"
                    placeholder={`${selectedCountry.dialCode} ...`}
                  />
                </div>

                <p className="text-[11px] leading-snug text-gray-500">
                  {t.phoneHint}
                </p>

                <button
                  type="submit"
                  className="mt-2 w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-black"
                >
                  {t.phoneContinue}
                </button>
              </form>

              <div className="my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs text-gray-500">{t.or}</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => signIn("google", { callbackUrl: "/onboarding" })}
                  className="flex w-full items-center justify-start gap-3 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium hover:bg-gray-50"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white">
                    <Image
                      src="/icons/google.svg"
                      alt="Google"
                      width={18}
                      height={18}
                    />
                  </span>
                  <span className="flex-1 text-center">
                    {t.continueGoogle}
                  </span>
                </button>

                <button
                  type="button"
                  className="flex w-full items-center justify-start gap-3 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium hover:bg-gray-50"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black">
                    <Image
                      src="/icons/apple.svg"
                      alt="Apple"
                      width={18}
                      height={18}
                    />
                  </span>
                  <span className="flex-1 text-center">
                    {t.continueApple}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthModalOpen(false);
                    window.location.href = "/login";
                  }}
                  className="flex w-full items-center justify-start gap-3 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium hover:bg-gray-50"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 bg-white">
                    <Image
                      src="/icons/mail.svg"
                      alt="E-mail"
                      width={18}
                      height={18}
                    />
                  </span>
                  <span className="flex-1 text-center">
                    {t.continueEmail}
                  </span>
                </button>

                <button
                  type="button"
                  className="mb-1 flex w-full items-center justify-start gap-3 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium hover:bg-gray-50"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1877F2]">
                    <Image
                      src="/icons/facebook.svg"
                      alt="Facebook"
                      width={18}
                      height={18}
                    />
                  </span>
                  <span className="flex-1 text-center">
                    {t.continueFacebook}
                  </span>
                </button>
              </div>

              <p className="mt-2 text-[11px] leading-snug text-gray-500">
                {t.authLegal}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

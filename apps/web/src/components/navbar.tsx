"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, FormEvent } from "react";
import Image from "next/image";
import { signIn, useSession } from "next-auth/react";
import { UserMenu } from "./layout/UserMenu";

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
      "On pourra t’appeler ou t’envoyer un SMS pour confirmer ton numéro. Des frais de messagerie et de données peuvent s’appliquer.",
    phoneContinue: "Continuer",
    or: "ou",
    continueGoogle: "Continuer avec Google",
    continueApple: "Continuer avec Apple",
    continueEmail: "Continuer avec l’adresse e-mail",
    continueFacebook: "Continuer avec Facebook",
    authLegal:
      "En continuant, tu confirmes que tu as lu et accepté les Conditions générales et la Politique de confidentialité de Lok’Room.",
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
      "继续操作即表示你已阅读并接受 Lok’Room 的条款和隐私政策。",
  },
};

type CookieNoticeTexts = {
  display: string;
  close: string;
};

const COOKIE_NOTICE_TEXTS: Record<LocaleCode, CookieNoticeTexts> = {
  fr: { display: "Affichage", close: "Fermer" },
  en: { display: "Display", close: "Close" },
  es: { display: "Visualización", close: "Cerrar" },
  de: { display: "Anzeige", close: "Schließen" },
  it: { display: "Visualizzazione", close: "Chiudi" },
  pt: { display: "Exibição", close: "Fechar" },
  zh: { display: "显示", close: "关闭" },
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
  role?: "HOST" | "GUEST" | "BOTH";
  isHost?: boolean;
};

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const [localeModalOpen, setLocaleModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [currentLocale, setCurrentLocale] = useState<LocaleCode>("fr");
  const [currentCurrency, setCurrentCurrency] = useState<string>("EUR");

  const { data: session, status } = useSession();
  const typedUser = session?.user as SessionUser | undefined;

  const isLoggedIn = status === "authenticated";
  const userRole = typedUser?.role ?? "GUEST";

  const isHost =
    typedUser?.isHost || userRole === "HOST" || userRole === "BOTH";

  const isOnHostArea = pathname?.startsWith("/host") ?? false;

  // Fermer le menu mobile quand on change de page
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

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

  const t = NAV_TEXTS[currentLocale] ?? NAV_TEXTS.fr;

  function setLocale(code: LocaleCode) {
    setCurrentLocale(code);
    if (typeof document !== "undefined") {
      document.cookie = `locale=${code}; path=/; max-age=31536000`;
      document.documentElement.lang = code;
      document.documentElement.setAttribute("data-locale", code);
      window.location.reload();
    }
    setLocaleModalOpen(false);
  }

  function setCurrency(code: string) {
    setCurrentCurrency(code);
    if (typeof document !== "undefined") {
      document.cookie = `currency=${code}; path=/; max-age=31536000`;
      window.location.reload();
    }
    setLocaleModalOpen(false);
  }

  function handlePhoneSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    alert("La connexion par téléphone sera bientôt disponible sur Lok'Room.");
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="font-semibold text-lg">
            Lokroom
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-4 md:flex">
            <Link
              href="/listings"
              className={pathname?.startsWith("/listings") ? "underline" : ""}
            >
              {t.navListings}
            </Link>

            {isLoggedIn && (
              <>
                <Link
                  href="/bookings"
                  className={pathname === "/bookings" ? "underline" : ""}
                >
                  {t.navBookings}
                </Link>
                <Link
                  href="/profile"
                  className={pathname === "/profile" ? "underline" : ""}
                >
                  {t.navProfile}
                </Link>
              </>
            )}

            <div className="ml-4 flex items-center gap-2">
              {/* Globe langue/devise */}
              <button
                type="button"
                onClick={() => setLocaleModalOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white transition hover:bg-gray-100 hover:shadow-md"
                aria-label="Choisir la langue et la devise"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5 text-gray-700"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20" />
                  <path d="M12 2a15 15 0 0 1 0 20" />
                  <path d="M12 2a15 15 0 0 0 0 20" />
                </svg>
              </button>

              {/* Pas connecté */}
              {!isLoggedIn && (
                <>
                  <Link
                    href="/become-host"
                    className="inline-flex items-center rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
                  >
                    {t.becomeHost}
                  </Link>

                  <button
                    type="button"
                    onClick={() => setAuthModalOpen(true)}
                    className="inline-flex items-center rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
                  >
                    {t.loginCta}
                  </button>
                </>
              )}

              {/* Connecté mais pas hôte */}
              {isLoggedIn && !isHost && (
                <>
                  <Link
                    href="/become-host"
                    className="inline-flex items-center rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
                  >
                    {t.becomeHost}
                  </Link>

                  <UserMenu />
                </>
              )}

              {/* Connecté + hôte */}
              {isLoggedIn && isHost && (
                <>
                  <Link
                    href="/listings/new"
                    className="inline-flex items-center rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
                  >
                    {t.createListing || "Créer une annonce"}
                  </Link>

                  {isOnHostArea ? (
                    <Link
                      href="/"
                      className="inline-flex items-center rounded-full bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
                    >
                      {t.travelerMode}
                    </Link>
                  ) : (
                    <Link
                      href="/host"
                      className="inline-flex items-center rounded-full bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
                    >
                      {t.hostMode}
                    </Link>
                  )}

                  <UserMenu />
                </>
              )}
            </div>
          </nav>

          {/* Burger mobile */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Ouvrir le menu"
            aria-expanded={open ? "true" : "false"}
            className="inline-flex h-9 w-9 items-center justify-center rounded hover:bg-gray-100 md:hidden"
          >
            <span className="sr-only">Menu</span>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 6h18M3 12h18M3 18h18"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </button>
        </div>

        {/* Panneau mobile */}
        {open && (
          <div className="border-t bg-white md:hidden">
            <nav className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-3">
              <Link
                href="/listings"
                className={`py-1 ${
                  pathname?.startsWith("/listings") ? "underline" : ""
                }`}
              >
                {t.navListings}
              </Link>

              {isLoggedIn && (
                <>
                  <Link
                    href="/bookings"
                    className={`py-1 ${
                      pathname === "/bookings" ? "underline" : ""
                    }`}
                  >
                    {t.navBookings}
                  </Link>
                  <Link
                    href="/profile"
                    className={`py-1 ${
                      pathname === "/profile" ? "underline" : ""
                    }`}
                  >
                    {t.navProfile}
                  </Link>
                </>
              )}

              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLocaleModalOpen(true)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white transition hover:bg-gray-100 hover:shadow-md"
                  aria-label="Choisir la langue et la devise"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5 text-gray-700"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M2 12h20" />
                    <path d="M12 2a15 15 0 0 1 0 20" />
                    <path d="M12 2a15 15 0 0 0 0 20" />
                  </svg>
                </button>

                {!isLoggedIn && (
                  <button
                    type="button"
                    onClick={() => setAuthModalOpen(true)}
                    className="inline-flex flex-1 items-center justify-center rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
                  >
                    {t.loginCta}
                  </button>
                )}
              </div>
            </nav>
          </div>
        )}

        <TopCookieNotice />
      </header>

      {/* MODAL LANGUE / DEVISE */}
      {localeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="max-h-[80vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
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

            <div className="grid gap-8 md:grid-cols-2">
              {/* Langues */}
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                  {t.modalLanguage}
                </h3>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
                      <span className="font-medium">{loc.label}</span>
                      <span className="text-xs uppercase text-gray-500">
                        {loc.code}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Devises */}
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                  {t.modalCurrency}
                </h3>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
                      <span className="font-medium">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-3xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
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

            <div className="auth-scroll flex-1 overflow-y-auto px-6 py-5">
              <h3 className="mb-4 text-xl font-semibold">
                {t.authWelcome}
              </h3>

              <form onSubmit={handlePhoneSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">
                    {t.phoneCountryLabel}
                  </label>
                  <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-0">
                    <option>Canada (+1)</option>
                    <option>France (+33)</option>
                    <option>États-Unis (+1)</option>
                    <option>Royaume-Uni (+44)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">
                    {t.phoneNumberLabel}
                  </label>
                  <input
                    type="tel"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-0"
                    placeholder={t.phoneNumberLabel}
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

function TopCookieNotice() {
  const [show, setShow] = useState(true);
  const [currency, setCurrency] = useState<string>("EUR");
  const [locale, setLocale] = useState<LocaleCode>("fr");

  useEffect(() => {
    if (typeof document === "undefined") return;

    const mCur = document.cookie.match(/(?:^|;\s*)currency=([^;]+)/);
    const mLoc = document.cookie.match(/(?:^|;\s*)locale=([^;]+)/);

    setCurrency(mCur?.[1] || "EUR");

    const loc = (mLoc?.[1] as LocaleCode | undefined) ?? getClientLocale();
    setLocale(loc);
  }, []);

  if (!show) return null;

  const texts = COOKIE_NOTICE_TEXTS[locale] ?? COOKIE_NOTICE_TEXTS.fr;

  return (
    <div className="border-t bg-gray-50">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2 text-xs text-gray-700">
        <div>
          {texts.display}&nbsp;:&nbsp;
          <strong>{currency}</strong>&nbsp;•&nbsp;
          <strong>{locale.toUpperCase()}</strong>
        </div>
        <button
          type="button"
          onClick={() => setShow(false)}
          className="rounded px-1.5 py-0.5 hover:bg-gray-100"
          aria-label={texts.close}
        >
          {texts.close}
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  QuestionMarkCircleIcon,
  ChevronDownIcon,
  HomeIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  XCircleIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

type FAQCategory = {
  id: string;
  title: string;
  icon: React.ReactNode;
  questions: {
    question: string;
    answer: string | React.ReactNode;
  }[];
};

const faqCategories: FAQCategory[] = [
  {
    id: "reservations",
    title: "Réservations",
    icon: <CalendarDaysIcon className="h-5 w-5" />,
    questions: [
      {
        question: "Comment réserver un espace sur Lok'Room ?",
        answer:
          "Pour réserver un espace, recherchez votre destination, sélectionnez les dates souhaitées, puis cliquez sur \"Réserver\". Vous serez guidé à travers le processus de paiement sécurisé.",
      },
      {
        question: "Puis-je modifier ma réservation après confirmation ?",
        answer:
          "Les modifications de réservation sont possibles sous certaines conditions. Contactez l'hôte via la messagerie pour discuter des changements. Les modifications de dates peuvent entraîner des ajustements de prix.",
      },
      {
        question: "Quels modes de paiement sont acceptés ?",
        answer:
          "Nous acceptons les cartes bancaires (Visa, Mastercard, American Express), Apple Pay et Google Pay. Tous les paiements sont sécurisés via Stripe.",
      },
    ],
  },
  {
    id: "annulation",
    title: "Politique d'annulation",
    icon: <XCircleIcon className="h-5 w-5" />,
    questions: [
      {
        question: "Quelle est la politique d'annulation pour les voyageurs ?",
        answer: (
          <div className="space-y-4">
            <p>Notre politique d&apos;annulation dépend du type de réservation :</p>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <h4 className="flex items-center gap-2 font-semibold text-gray-900">
                <CalendarDaysIcon className="h-5 w-5 text-blue-500" />
                Réservations journée/nuitée (durée ≥ 24h)
              </h4>
              <ul className="mt-3 space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                  <span>
                    <strong>≥ 72h avant l&apos;arrivée :</strong> Remboursement à 100% (frais de
                    service de 5% retenus, max 2,50€)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                  <span>
                    <strong>Entre 24h et 72h avant :</strong> Remboursement à 50% (hors frais de
                    service)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircleIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                  <span>
                    <strong>&lt; 24h avant l&apos;arrivée :</strong> Aucun remboursement
                  </span>
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <h4 className="flex items-center gap-2 font-semibold text-gray-900">
                <ClockIcon className="h-5 w-5 text-purple-500" />
                Réservations à l&apos;heure (durée &lt; 24h)
              </h4>
              <ul className="mt-3 space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                  <span>
                    <strong>≥ 6h avant le début :</strong> Remboursement à 100% (hors frais de
                    service)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                  <span>
                    <strong>Entre 2h et 6h avant :</strong> Remboursement à 50% (hors frais de
                    service)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircleIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                  <span>
                    <strong>&lt; 2h avant le début :</strong> Aucun remboursement
                  </span>
                </li>
              </ul>
            </div>

            <p className="text-sm text-gray-500">
              Les frais de service couvrent les coûts de transaction, de serveur et de maintenance
              de la plateforme.
            </p>
          </div>
        ),
      },
      {
        question: "Comment annuler ma réservation ?",
        answer:
          "Pour annuler votre réservation, rendez-vous dans \"Mes réservations\", sélectionnez la réservation concernée, puis cliquez sur \"Annuler la réservation\". Le remboursement sera calculé automatiquement selon notre politique d'annulation.",
      },
      {
        question: "Quand vais-je recevoir mon remboursement ?",
        answer:
          "Les remboursements sont traités sous 5 à 10 jours ouvrés après l'annulation. Le délai exact dépend de votre établissement bancaire.",
      },
    ],
  },
  {
    id: "hotes",
    title: "Pour les hôtes",
    icon: <HomeIcon className="h-5 w-5" />,
    questions: [
      {
        question: "Que se passe-t-il si un voyageur annule sa réservation ?",
        answer: (
          <div className="space-y-3">
            <p>
              En tant qu&apos;hôte, voici ce que vous recevez selon le moment de l&apos;annulation :
            </p>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <h4 className="font-semibold text-gray-900">Réservations journée/nuitée (≥ 24h)</h4>
              <ul className="mt-2 space-y-1 text-sm">
                <li>
                  • <strong>Annulation ≥ 72h avant :</strong> Vous ne recevez rien (remboursement
                  total au voyageur)
                </li>
                <li>
                  • <strong>Annulation 24h-72h avant :</strong> Vous recevez 50% du montant
                </li>
                <li>
                  • <strong>Annulation &lt; 24h avant :</strong> Vous recevez 100% du montant
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <h4 className="font-semibold text-gray-900">Réservations à l&apos;heure (&lt; 24h)</h4>
              <ul className="mt-2 space-y-1 text-sm">
                <li>
                  • <strong>Annulation ≥ 6h avant :</strong> Vous ne recevez rien
                </li>
                <li>
                  • <strong>Annulation 2h-6h avant :</strong> Vous recevez 50% du montant
                </li>
                <li>
                  • <strong>Annulation &lt; 2h avant :</strong> Vous recevez 100% du montant
                </li>
              </ul>
            </div>
          </div>
        ),
      },
      {
        question: "Comment devenir hôte sur Lok'Room ?",
        answer:
          "Pour devenir hôte, créez un compte, accédez à \"Devenir hôte\" dans votre profil, complétez la vérification d'identité et ajoutez votre première annonce. Vous devrez également connecter un compte Stripe pour recevoir vos paiements.",
      },
      {
        question: "Quels sont les frais pour les hôtes ?",
        answer:
          "Lok'Room prélève une commission de 3% sur chaque réservation. Cette commission couvre les frais de paiement, l'assurance et le support client.",
      },
      {
        question: "Puis-je annuler une réservation en tant qu'hôte ?",
        answer:
          "Les hôtes peuvent annuler une réservation en cas de force majeure uniquement. Les annulations répétées peuvent entraîner des pénalités et affecter votre classement. Contactez le support si vous devez annuler.",
      },
    ],
  },
  {
    id: "paiements",
    title: "Paiements",
    icon: <CreditCardIcon className="h-5 w-5" />,
    questions: [
      {
        question: "Comment sont calculés les frais de service ?",
        answer: (
          <div className="space-y-3">
            <p>Les frais de service Lok&apos;Room sont de :</p>
            <ul className="list-inside list-disc space-y-1">
              <li>
                <strong>Pour les voyageurs :</strong> 5% du montant total de la réservation
                (plafonné à 2,50€ par transaction)
              </li>
              <li>
                <strong>Pour les hôtes :</strong> 3% du montant de chaque réservation
              </li>
            </ul>
            <p className="text-sm text-gray-500">
              Ces frais couvrent les coûts de transaction bancaire, la maintenance des serveurs, le
              support client et l&apos;assurance.
            </p>
          </div>
        ),
      },
      {
        question: "Quand l'hôte reçoit-il son paiement ?",
        answer:
          "L'hôte reçoit son paiement 24h après le début de la réservation, une fois que le voyageur a confirmé son arrivée. En cas de litige, les fonds sont bloqués jusqu'à résolution.",
      },
      {
        question: "Mes paiements sont-ils sécurisés ?",
        answer:
          "Oui, tous les paiements sont traités via Stripe, un leader mondial du paiement en ligne. Vos données bancaires ne sont jamais stockées sur nos serveurs.",
      },
    ],
  },
  {
    id: "securite",
    title: "Sécurité & Confiance",
    icon: <ShieldCheckIcon className="h-5 w-5" />,
    questions: [
      {
        question: "Comment Lok'Room vérifie-t-il les utilisateurs ?",
        answer:
          "Nous vérifions l'identité des utilisateurs via Stripe Identity. Les hôtes doivent fournir une pièce d'identité valide et les voyageurs sont encouragés à compléter leur profil et à se faire vérifier.",
      },
      {
        question: "Que faire en cas de problème avec une réservation ?",
        answer:
          "En cas de problème, contactez d'abord l'hôte via la messagerie. Si vous ne trouvez pas de solution, contactez notre support qui interviendra pour résoudre le litige.",
      },
      {
        question: "Mes données personnelles sont-elles protégées ?",
        answer:
          "Oui, nous respectons le RGPD et ne partageons jamais vos données avec des tiers sans votre consentement. Consultez notre politique de confidentialité pour plus de détails.",
      },
    ],
  },
];

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<string | null>("annulation");
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  const toggleQuestion = (categoryId: string, questionIndex: number) => {
    const key = `${categoryId}-${questionIndex}`;
    setExpandedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  // Filter FAQ based on search
  const filteredCategories = faqCategories
    .map((category) => ({
      ...category,
      questions: category.questions.filter(
        (q) =>
          !searchQuery ||
          q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (typeof q.answer === "string" &&
            q.answer.toLowerCase().includes(searchQuery.toLowerCase()))
      ),
    }))
    .filter((category) => category.questions.length > 0);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pb-16 pt-12">
        <div className="mx-auto max-w-4xl 2xl:max-w-5xl 3xl:max-w-6xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Retour à l&apos;accueil
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
              <QuestionMarkCircleIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Centre d&apos;aide</h1>
              <p className="mt-1 text-gray-400">
                Trouvez des réponses à toutes vos questions
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative mt-8">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une question..."
              className="w-full rounded-xl border-0 bg-white py-4 pl-12 pr-4 text-gray-900 placeholder-gray-500 shadow-lg focus:outline-none focus:ring-2 focus:ring-white/20"
            />
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="mx-auto -mt-8 max-w-4xl 2xl:max-w-5xl 3xl:max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Signaler un problème - Mise en avant */}
        <Link
          href="/help/issue"
          className="mb-4 flex items-center gap-4 rounded-xl border-2 border-red-200 bg-gradient-to-r from-red-50 to-orange-50 p-5 shadow-sm transition-all hover:shadow-md hover:border-red-300"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <ExclamationTriangleIcon className="h-7 w-7 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">Signaler un problème</h3>
            <p className="text-sm text-gray-600">
              Un souci avec une réservation ? Ouvrez un litige en quelques clics
            </p>
          </div>
          <div className="hidden sm:block">
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
              Obtenir de l&apos;aide
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </Link>

        <div className="grid gap-4 sm:grid-cols-3">
          <Link
            href="/messages"
            className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Messagerie</h3>
              <p className="text-xs text-gray-500">Contacter un hôte</p>
            </div>
          </Link>

          <Link
            href="/bookings"
            className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
              <CalendarDaysIcon className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Mes réservations</h3>
              <p className="text-xs text-gray-500">Gérer mes voyages</p>
            </div>
          </Link>

          <Link
            href="/disputes"
            className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
              <ExclamationTriangleIcon className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Mes litiges</h3>
              <p className="text-xs text-gray-500">Suivre mes demandes</p>
            </div>
          </Link>
        </div>
      </div>

      {/* FAQ Categories */}
      <div className="mx-auto max-w-4xl 2xl:max-w-5xl 3xl:max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-lg font-semibold text-gray-900">Questions fréquentes</h2>

        <div className="mt-6 space-y-4">
          {filteredCategories.map((category) => (
            <div
              key={category.id}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white"
            >
              {/* Category Header */}
              <button
                onClick={() =>
                  setExpandedCategory(expandedCategory === category.id ? null : category.id)
                }
                className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                    {category.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{category.title}</h3>
                    <p className="text-xs text-gray-500">{category.questions.length} questions</p>
                  </div>
                </div>
                <ChevronDownIcon
                  className={`h-5 w-5 text-gray-400 transition-transform ${
                    expandedCategory === category.id ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Questions */}
              {expandedCategory === category.id && (
                <div className="border-t border-gray-100">
                  {category.questions.map((q, index) => (
                    <div key={index} className="border-b border-gray-100 last:border-b-0">
                      <button
                        onClick={() => toggleQuestion(category.id, index)}
                        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-gray-50"
                      >
                        <span className="pr-4 font-medium text-gray-700">{q.question}</span>
                        <ChevronDownIcon
                          className={`h-4 w-4 flex-shrink-0 text-gray-400 transition-transform ${
                            expandedQuestions.has(`${category.id}-${index}`) ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {expandedQuestions.has(`${category.id}-${index}`) && (
                        <div className="bg-gray-50 px-5 py-4 text-sm text-gray-600">{q.answer}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredCategories.length === 0 && (
          <div className="mt-8 text-center">
            <QuestionMarkCircleIcon className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 font-medium text-gray-900">Aucun résultat</h3>
            <p className="mt-1 text-sm text-gray-500">
              Essayez une autre recherche ou contactez notre support
            </p>
          </div>
        )}

        {/* Cancellation Policy Summary */}
        <div className="mt-12 rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <XCircleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Politique d&apos;annulation en bref
              </h2>
              <p className="text-sm text-gray-500">Résumé pour voyageurs et hôtes</p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {/* For Travelers */}
            <div className="rounded-xl bg-blue-50 p-5">
              <h3 className="flex items-center gap-2 font-semibold text-blue-900">
                <UserGroupIcon className="h-5 w-5" />
                Pour les voyageurs
              </h3>

              <div className="mt-4 space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-blue-800">Réservations ≥ 24h</h4>
                  <div className="mt-2 space-y-1 text-sm text-blue-700">
                    <p className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      ≥ 72h avant : 100% remboursé*
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      24h-72h avant : 50% remboursé
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      &lt; 24h avant : Aucun remboursement
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-blue-800">Réservations &lt; 24h</h4>
                  <div className="mt-2 space-y-1 text-sm text-blue-700">
                    <p className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      ≥ 6h avant : 100% remboursé*
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      2h-6h avant : 50% remboursé
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      &lt; 2h avant : Aucun remboursement
                    </p>
                  </div>
                </div>

                <p className="text-xs text-blue-600">
                  * Hors frais de service (5%, max 2,50€)
                </p>
              </div>
            </div>

            {/* For Hosts */}
            <div className="rounded-xl bg-emerald-50 p-5">
              <h3 className="flex items-center gap-2 font-semibold text-emerald-900">
                <HomeIcon className="h-5 w-5" />
                Pour les hôtes
              </h3>

              <div className="mt-4 space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-emerald-800">Ce que vous recevez</h4>
                  <div className="mt-2 space-y-1 text-sm text-emerald-700">
                    <p>
                      • Annulation tardive (&lt; 24h ou &lt; 2h) : <strong>100%</strong>
                    </p>
                    <p>
                      • Annulation entre 24h-72h ou 2h-6h : <strong>50%</strong>
                    </p>
                    <p>
                      • Annulation anticipée : <strong>0%</strong>
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-emerald-800">
                    Annulation par l&apos;hôte
                  </h4>
                  <p className="mt-2 text-sm text-emerald-700">
                    Les annulations par l&apos;hôte sont possibles uniquement en cas de force
                    majeure. Des pénalités peuvent s&apos;appliquer en cas d&apos;annulations
                    répétées.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-8 rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 p-6 text-white">
          <div className="flex flex-col items-center text-center sm:flex-row sm:text-left">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
              <ChatBubbleLeftRightIcon className="h-7 w-7" />
            </div>
            <div className="mt-4 sm:ml-4 sm:mt-0">
              <h3 className="text-lg font-semibold">Vous n&apos;avez pas trouvé votre réponse ?</h3>
              <p className="mt-1 text-gray-300">
                Support humain : 9h-17h (tous les jours)
              </p>
              <p className="mt-1 text-blue-300 font-medium">
                Support IA : 24h/24 7j/7
              </p>
            </div>
            <div className="mt-4 sm:ml-auto sm:mt-0">
              <Link
                href="/messages?support=true"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-medium text-gray-900 transition-colors hover:bg-gray-100"
              >
                Contacter le support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

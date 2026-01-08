"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShieldCheckIcon,
  ChevronRightIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";

// Status config
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof ClockIcon }> = {
  OPEN: { label: "Ouvert", color: "bg-blue-100 text-blue-800", icon: ClockIcon },
  UNDER_REVIEW: { label: "En examen", color: "bg-yellow-100 text-yellow-800", icon: ClockIcon },
  AWAITING_HOST: { label: "Attente hôte", color: "bg-orange-100 text-orange-800", icon: ClockIcon },
  AWAITING_GUEST: { label: "Attente voyageur", color: "bg-orange-100 text-orange-800", icon: ClockIcon },
  MEDIATION: { label: "Médiation", color: "bg-purple-100 text-purple-800", icon: ShieldCheckIcon },
  RESOLVED_GUEST: { label: "Résolu", color: "bg-green-100 text-green-800", icon: CheckCircleIcon },
  RESOLVED_HOST: { label: "Résolu", color: "bg-green-100 text-green-800", icon: CheckCircleIcon },
  RESOLVED_PARTIAL: { label: "Résolu", color: "bg-green-100 text-green-800", icon: CheckCircleIcon },
  CLOSED: { label: "Fermé", color: "bg-gray-100 text-gray-800", icon: XCircleIcon },
  ESCALATED: { label: "Escaladé", color: "bg-red-100 text-red-800", icon: ExclamationTriangleIcon },
};

const REASON_LABELS: Record<string, string> = {
  PROPERTY_NOT_AS_DESCRIBED: "Espace non conforme",
  CLEANLINESS_ISSUE: "Propreté",
  AMENITIES_MISSING: "Équipements",
  HOST_UNRESPONSIVE: "Hôte injoignable",
  GUEST_DAMAGE: "Dégâts",
  GUEST_VIOLATION: "Non-respect règles",
  PAYMENT_ISSUE: "Paiement",
  CANCELLATION_DISPUTE: "Annulation",
  SAFETY_CONCERN: "Sécurité",
  NOISE_COMPLAINT: "Nuisances",
  UNAUTHORIZED_GUESTS: "Invités non autorisés",
  OTHER: "Autre",
};

interface DisputeListItem {
  id: string;
  status: string;
  reason: string;
  description: string;
  claimedAmountCents: number | null;
  responseDeadline: string | null;
  hasResponse: boolean;
  isEscalated: boolean;
  createdAt: string;
  updatedAt: string;
  booking: {
    id: string;
    listing: {
      id: string;
      title: string;
      city: string;
      imageUrl: string | null;
    };
  };
  openedBy: {
    id: string;
    name: string;
    isMe: boolean;
  };
  against: {
    id: string;
    name: string;
    isMe: boolean;
  };
  messagesCount: number;
}

export default function DisputesListPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [disputes, setDisputes] = useState<DisputeListItem[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });

  useEffect(() => {
    const fetchDisputes = async () => {
      setLoading(true);
      try {
        const statusParam = filter !== "all" ? `&status=${filter}` : "";
        const res = await fetch(`/api/disputes?page=${pagination.page}${statusParam}`);
        const data = await res.json();
        setDisputes(data.disputes || []);
        setPagination(data.pagination || { page: 1, total: 0, totalPages: 0 });
      } catch {
        // Ignore
      } finally {
        setLoading(false);
      }
    };

    fetchDisputes();
  }, [filter, pagination.page]);

  const activeDisputes = disputes.filter((d) =>
    !["CLOSED", "RESOLVED_GUEST", "RESOLVED_HOST", "RESOLVED_PARTIAL"].includes(d.status)
  );
  const resolvedDisputes = disputes.filter((d) =>
    ["CLOSED", "RESOLVED_GUEST", "RESOLVED_HOST", "RESOLVED_PARTIAL"].includes(d.status)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-semibold text-gray-900">Mes litiges</h1>
          <p className="text-gray-500 mt-1">
            Gérez vos litiges et suivez leur résolution
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <FunnelIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
          {[
            { value: "all", label: "Tous" },
            { value: "OPEN", label: "Ouverts" },
            { value: "UNDER_REVIEW", label: "En examen" },
            { value: "ESCALATED", label: "Escaladés" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setFilter(f.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                filter === f.value
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:border-gray-400"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        ) : disputes.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <ShieldCheckIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-gray-900 mb-2">Aucun litige</h2>
            <p className="text-gray-500">
              Vous n'avez aucun litige en cours. C'est une bonne nouvelle !
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active disputes */}
            {activeDisputes.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                  En cours ({activeDisputes.length})
                </h2>
                <div className="space-y-3">
                  {activeDisputes.map((dispute) => (
                    <DisputeCard key={dispute.id} dispute={dispute} />
                  ))}
                </div>
              </div>
            )}

            {/* Resolved disputes */}
            {resolvedDisputes.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                  Résolus ({resolvedDisputes.length})
                </h2>
                <div className="space-y-3">
                  {resolvedDisputes.map((dispute) => (
                    <DisputeCard key={dispute.id} dispute={dispute} />
                  ))}
                </div>
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 pt-4">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setPagination((p) => ({ ...p, page }))}
                    className={`w-10 h-10 rounded-full font-medium transition ${
                      pagination.page === page
                        ? "bg-gray-900 text-white"
                        : "bg-white text-gray-700 border border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function DisputeCard({ dispute }: { dispute: DisputeListItem }) {
  const statusConfig = STATUS_CONFIG[dispute.status] || STATUS_CONFIG.OPEN;
  const StatusIcon = statusConfig.icon;
  const needsAction = dispute.against.isMe && !dispute.hasResponse && dispute.status === "OPEN";

  return (
    <Link
      href={`/disputes/${dispute.id}`}
      className="block bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition"
    >
      <div className="flex items-start gap-4">
        {dispute.booking.listing.imageUrl ? (
          <Image
            src={dispute.booking.listing.imageUrl}
            alt={dispute.booking.listing.title}
            width={64}
            height={64}
            className="rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-medium text-gray-900 truncate">
                {dispute.booking.listing.title}
              </h3>
              <p className="text-sm text-gray-500">{dispute.booking.listing.city}</p>
            </div>
            <span
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${statusConfig.color}`}
            >
              <StatusIcon className="w-3 h-3" />
              {statusConfig.label}
            </span>
          </div>

          <div className="mt-2 flex items-center gap-4 text-sm">
            <span className="text-gray-500">
              {REASON_LABELS[dispute.reason]}
            </span>
            {dispute.claimedAmountCents && (
              <span className="text-gray-900 font-medium">
                {(dispute.claimedAmountCents / 100).toFixed(2)} €
              </span>
            )}
            {dispute.messagesCount > 0 && (
              <span className="text-gray-400">
                {dispute.messagesCount} message{dispute.messagesCount > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {needsAction && (
            <div className="mt-2 flex items-center gap-2 text-amber-600">
              <ExclamationTriangleIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Réponse requise</span>
            </div>
          )}

          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {dispute.openedBy.isMe ? "Ouvert par vous" : `Ouvert par ${dispute.openedBy.name}`}
              {" • "}
              {new Date(dispute.createdAt).toLocaleDateString("fr-FR")}
            </span>
            <ChevronRightIcon className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>
    </Link>
  );
}

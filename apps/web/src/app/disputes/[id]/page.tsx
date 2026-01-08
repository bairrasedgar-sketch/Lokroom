"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeftIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";

// Status labels et couleurs
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof ClockIcon }> = {
  OPEN: { label: "Ouvert", color: "bg-blue-100 text-blue-800", icon: ClockIcon },
  UNDER_REVIEW: { label: "En cours d'examen", color: "bg-yellow-100 text-yellow-800", icon: ClockIcon },
  AWAITING_HOST: { label: "En attente de l'hôte", color: "bg-orange-100 text-orange-800", icon: ClockIcon },
  AWAITING_GUEST: { label: "En attente du voyageur", color: "bg-orange-100 text-orange-800", icon: ClockIcon },
  MEDIATION: { label: "En médiation", color: "bg-purple-100 text-purple-800", icon: ShieldCheckIcon },
  RESOLVED_GUEST: { label: "Résolu (voyageur)", color: "bg-green-100 text-green-800", icon: CheckCircleIcon },
  RESOLVED_HOST: { label: "Résolu (hôte)", color: "bg-green-100 text-green-800", icon: CheckCircleIcon },
  RESOLVED_PARTIAL: { label: "Résolu (partiel)", color: "bg-green-100 text-green-800", icon: CheckCircleIcon },
  CLOSED: { label: "Fermé", color: "bg-gray-100 text-gray-800", icon: XCircleIcon },
  ESCALATED: { label: "Escaladé", color: "bg-red-100 text-red-800", icon: ExclamationTriangleIcon },
};

// Reason labels
const REASON_LABELS: Record<string, string> = {
  PROPERTY_NOT_AS_DESCRIBED: "Espace non conforme",
  CLEANLINESS_ISSUE: "Problème de propreté",
  AMENITIES_MISSING: "Équipements manquants",
  HOST_UNRESPONSIVE: "Hôte injoignable",
  GUEST_DAMAGE: "Dégâts causés",
  GUEST_VIOLATION: "Non-respect des règles",
  PAYMENT_ISSUE: "Problème de paiement",
  CANCELLATION_DISPUTE: "Litige d'annulation",
  SAFETY_CONCERN: "Problème de sécurité",
  NOISE_COMPLAINT: "Nuisances sonores",
  UNAUTHORIZED_GUESTS: "Invités non autorisés",
  OTHER: "Autre",
};

interface DisputeData {
  id: string;
  status: string;
  reason: string;
  category: string;
  priority: number;
  description: string;
  claimedAmountCents: number | null;
  awardedAmountCents: number | null;
  resolution: string | null;
  responseDeadline: string | null;
  hasResponse: boolean;
  isEscalated: boolean;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  booking: {
    id: string;
    startDate: string;
    endDate: string;
    totalPrice: number;
    currency: string;
    listing: {
      id: string;
      title: string;
      city: string;
      images: string[];
    };
  };
  openedBy: {
    id: string;
    name: string;
    avatarUrl: string | null;
    isMe: boolean;
  };
  against: {
    id: string;
    name: string;
    avatarUrl: string | null;
    isMe: boolean;
  };
  assignedAdmin: { id: string; name: string } | null;
  evidence: Array<{
    id: string;
    fileUrl: string;
    fileType: string;
    fileName: string;
    description: string | null;
    createdAt: string;
    uploadedBy: { id: string; name: string; isMe: boolean };
  }>;
  messages: Array<{
    id: string;
    content: string;
    isAdmin: boolean;
    isSystem: boolean;
    createdAt: string;
    sender: { id: string; name: string; avatarUrl: string | null; isMe: boolean };
  }>;
  timeline: Array<{
    id: string;
    event: string;
    details: string | null;
    createdAt: string;
  }>;
  canRespond: boolean;
  canAddEvidence: boolean;
  canSendMessage: boolean;
}

export default function DisputeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const disputeId = params.id as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [dispute, setDispute] = useState<DisputeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [responding, setResponding] = useState(false);

  const fetchDispute = async () => {
    try {
      const res = await fetch(`/api/disputes/${disputeId}`);
      const data = await res.json();
      if (data.dispute) {
        setDispute(data.dispute);
      } else {
        setError("Litige introuvable");
      }
    } catch {
      setError("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDispute();
    // Polling toutes les 30 secondes
    const interval = setInterval(fetchDispute, 30000);
    return () => clearInterval(interval);
  }, [disputeId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [dispute?.messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/disputes/${disputeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "message", content: newMessage.trim() }),
      });

      if (res.ok) {
        setNewMessage("");
        fetchDispute();
      }
    } catch {
      // Ignore
    } finally {
      setSending(false);
    }
  };

  const handleRespond = async () => {
    if (!responseText.trim() || responding) return;

    setResponding(true);
    try {
      const res = await fetch(`/api/disputes/${disputeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "respond", response: responseText.trim() }),
      });

      if (res.ok) {
        setResponseText("");
        fetchDispute();
      }
    } catch {
      // Ignore
    } finally {
      setResponding(false);
    }
  };

  const handleEscalate = async () => {
    if (!confirm("Êtes-vous sûr de vouloir escalader ce litige ? Cette action est irréversible.")) {
      return;
    }

    try {
      await fetch(`/api/disputes/${disputeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "escalate", reason: "Demande d'escalade par l'utilisateur" }),
      });
      fetchDispute();
    } catch {
      // Ignore
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (error || !dispute) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-red-600 mb-4">{error || "Litige introuvable"}</p>
        <Link href="/disputes" className="text-gray-900 underline">
          Retour aux litiges
        </Link>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[dispute.status] || STATUS_CONFIG.OPEN;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          <div className="text-center">
            <h1 className="font-semibold text-gray-900">Litige #{dispute.id.slice(-6)}</h1>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
              <StatusIcon className="w-3 h-3" />
              {statusConfig.label}
            </span>
          </div>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking info */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h2 className="font-medium text-gray-900 mb-3">Réservation concernée</h2>
              <div className="flex items-center gap-4">
                {dispute.booking.listing.images[0] ? (
                  <Image
                    src={dispute.booking.listing.images[0]}
                    alt={dispute.booking.listing.title}
                    width={80}
                    height={80}
                    className="rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-200 rounded-lg" />
                )}
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{dispute.booking.listing.title}</h3>
                  <p className="text-sm text-gray-500">{dispute.booking.listing.city}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(dispute.booking.startDate).toLocaleDateString("fr-FR")} -{" "}
                    {new Date(dispute.booking.endDate).toLocaleDateString("fr-FR")}
                  </p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {dispute.booking.totalPrice.toFixed(2)} {dispute.booking.currency}
                  </p>
                </div>
              </div>
            </div>

            {/* Dispute details */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h2 className="font-medium text-gray-900 mb-3">Détails du litige</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500">Raison</span>
                  <p className="font-medium text-gray-900">{REASON_LABELS[dispute.reason]}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Description</span>
                  <p className="text-gray-700 text-sm mt-1 whitespace-pre-wrap">{dispute.description}</p>
                </div>
                {dispute.claimedAmountCents && (
                  <div>
                    <span className="text-sm text-gray-500">Montant réclamé</span>
                    <p className="font-medium text-gray-900">
                      {(dispute.claimedAmountCents / 100).toFixed(2)} {dispute.booking.currency}
                    </p>
                  </div>
                )}
                {dispute.awardedAmountCents !== null && (
                  <div>
                    <span className="text-sm text-gray-500">Montant accordé</span>
                    <p className="font-medium text-green-600">
                      {(dispute.awardedAmountCents / 100).toFixed(2)} {dispute.booking.currency}
                    </p>
                  </div>
                )}
                {dispute.resolution && (
                  <div>
                    <span className="text-sm text-gray-500">Résolution</span>
                    <p className="text-gray-700 text-sm mt-1">{dispute.resolution}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Response section (if needed) */}
            {dispute.canRespond && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex gap-3 mb-4">
                  <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-amber-800">Réponse requise</h3>
                    <p className="text-sm text-amber-700">
                      Vous avez jusqu'au{" "}
                      {dispute.responseDeadline
                        ? new Date(dispute.responseDeadline).toLocaleDateString("fr-FR")
                        : "bientôt"}{" "}
                      pour répondre à ce litige.
                    </p>
                  </div>
                </div>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Expliquez votre point de vue..."
                  rows={4}
                  className="w-full px-4 py-3 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none mb-3"
                />
                <button
                  onClick={handleRespond}
                  disabled={!responseText.trim() || responding}
                  className="w-full py-2 bg-amber-600 text-white rounded-lg font-medium disabled:opacity-50 hover:bg-amber-700 transition"
                >
                  {responding ? "Envoi..." : "Envoyer ma réponse"}
                </button>
              </div>
            )}

            {/* Messages */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h2 className="font-medium text-gray-900 flex items-center gap-2">
                  <ChatBubbleLeftRightIcon className="w-5 h-5" />
                  Messages ({dispute.messages.length})
                </h2>
              </div>
              <div className="max-h-96 overflow-y-auto p-4 space-y-4">
                {dispute.messages.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Aucun message pour le moment</p>
                ) : (
                  dispute.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${msg.sender.isMe ? "flex-row-reverse" : ""}`}
                    >
                      {msg.sender.avatarUrl ? (
                        <Image
                          src={msg.sender.avatarUrl}
                          alt={msg.sender.name || ""}
                          width={36}
                          height={36}
                          className="rounded-full flex-shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 text-sm font-medium flex-shrink-0">
                          {msg.sender.name?.charAt(0) || "?"}
                        </div>
                      )}
                      <div className={`max-w-[70%] ${msg.sender.isMe ? "text-right" : ""}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {msg.sender.name}
                            {msg.isAdmin && (
                              <span className="ml-1 text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                                Admin
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(msg.createdAt).toLocaleString("fr-FR")}
                          </span>
                        </div>
                        <div
                          className={`inline-block px-4 py-2 rounded-2xl ${
                            msg.sender.isMe
                              ? "bg-gray-900 text-white rounded-br-md"
                              : msg.isAdmin
                              ? "bg-purple-100 text-purple-900 rounded-bl-md"
                              : "bg-gray-100 text-gray-900 rounded-bl-md"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              {dispute.canSendMessage && (
                <div className="p-4 border-t border-gray-100">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                      placeholder="Écrivez un message..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sending}
                      className="p-2 bg-gray-900 text-white rounded-full disabled:opacity-50 hover:bg-black transition"
                    >
                      <PaperAirplaneIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Evidence */}
            {dispute.evidence.length > 0 && (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h2 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <DocumentTextIcon className="w-5 h-5" />
                  Preuves ({dispute.evidence.length})
                </h2>
                <div className="space-y-3">
                  {dispute.evidence.map((ev) => (
                    <a
                      key={ev.id}
                      href={ev.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                    >
                      <DocumentTextIcon className="w-8 h-8 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{ev.fileName}</p>
                        <p className="text-xs text-gray-500">
                          Par {ev.uploadedBy.name} • {new Date(ev.createdAt).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Parties */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h2 className="font-medium text-gray-900 mb-3">Parties concernées</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {dispute.openedBy.avatarUrl ? (
                    <Image
                      src={dispute.openedBy.avatarUrl}
                      alt={dispute.openedBy.name || ""}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium">
                      {dispute.openedBy.name?.charAt(0) || "?"}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">
                      {dispute.openedBy.name}
                      {dispute.openedBy.isMe && (
                        <span className="ml-1 text-xs text-gray-500">(vous)</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">A ouvert le litige</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {dispute.against.avatarUrl ? (
                    <Image
                      src={dispute.against.avatarUrl}
                      alt={dispute.against.name || ""}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium">
                      {dispute.against.name?.charAt(0) || "?"}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">
                      {dispute.against.name}
                      {dispute.against.isMe && (
                        <span className="ml-1 text-xs text-gray-500">(vous)</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">Partie adverse</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <button
                onClick={() => setShowTimeline(!showTimeline)}
                className="w-full flex items-center justify-between"
              >
                <h2 className="font-medium text-gray-900">Historique</h2>
                {showTimeline ? (
                  <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                )}
              </button>
              {showTimeline && (
                <div className="mt-4 space-y-3">
                  {dispute.timeline.map((event) => (
                    <div key={event.id} className="flex gap-3">
                      <div className="w-2 h-2 mt-2 rounded-full bg-gray-300" />
                      <div>
                        <p className="text-sm text-gray-900">{event.details || event.event}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(event.createdAt).toLocaleString("fr-FR")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            {!dispute.isEscalated && !["CLOSED", "RESOLVED_GUEST", "RESOLVED_HOST", "RESOLVED_PARTIAL"].includes(dispute.status) && (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h2 className="font-medium text-gray-900 mb-3">Actions</h2>
                <button
                  onClick={handleEscalate}
                  className="w-full py-2 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 transition"
                >
                  Escalader à Lok'Room
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  Si vous n'arrivez pas à résoudre le problème, notre équipe interviendra.
                </p>
              </div>
            )}

            {/* Dates */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h2 className="font-medium text-gray-900 mb-3">Dates</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Ouvert le</span>
                  <span className="text-gray-900">
                    {new Date(dispute.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                {dispute.responseDeadline && !dispute.hasResponse && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Deadline réponse</span>
                    <span className="text-amber-600 font-medium">
                      {new Date(dispute.responseDeadline).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                )}
                {dispute.resolvedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Résolu le</span>
                    <span className="text-green-600">
                      {new Date(dispute.resolvedAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/**
 * Page Admin - Detail litige avec timeline
 */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeftIcon,
  FlagIcon,
  UserCircleIcon,
  DocumentTextIcon,
  PhotoIcon,
  PaperClipIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  ChevronUpIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

type User = {
  id: string;
  name: string | null;
  email: string;
  profile?: { avatarUrl: string | null } | null;
};

type Listing = {
  id: string;
  title: string;
  city: string;
  country: string;
  price: number;
  currency: string;
  images: Array<{ url: string }>;
  owner: User;
};

type Booking = {
  id: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  currency: string;
  status: string;
  listing: Listing;
  guest: User;
};

type Evidence = {
  id: string;
  fileUrl: string;
  fileType: string;
  fileName: string;
  description: string | null;
  createdAt: string;
  uploadedBy: { id: string; name: string | null };
};

type Message = {
  id: string;
  content: string;
  isAdmin: boolean;
  isSystem: boolean;
  createdAt: string;
  sender: User;
};

type TimelineItem = {
  id: string;
  type: string;
  date: string;
  user: { id: string; name: string | null };
  content: string;
  isAdmin?: boolean;
  fileUrl?: string;
  fileType?: string;
  fileName?: string;
  details?: Record<string, unknown>;
};

type AdminNote = {
  id: string;
  content: string;
  createdAt: string;
  author: { name: string | null };
};

type DisputeData = {
  id: string;
  reason: string;
  status: string;
  description: string;
  claimedAmountCents: number | null;
  awardedAmountCents: number | null;
  resolution: string | null;
  priority: number;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  booking: Booking;
  openedBy: User;
  against: User;
  assignedAdmin: { id: string; name: string | null; email: string } | null;
  evidence: Evidence[];
  messages: Message[];
  timeline: TimelineItem[];
  coverImage: string | null;
  adminNotes: AdminNote[];
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  OPEN: { label: "Ouvert", color: "text-red-700", bgColor: "bg-red-100", icon: ExclamationTriangleIcon },
  IN_REVIEW: { label: "En examen", color: "text-blue-700", bgColor: "bg-blue-100", icon: ClockIcon },
  ESCALATED: { label: "Escaladé", color: "text-purple-700", bgColor: "bg-purple-100", icon: ChevronUpIcon },
  RESOLVED_REFUND: { label: "Résolu (remboursement)", color: "text-green-700", bgColor: "bg-green-100", icon: CheckCircleIcon },
  RESOLVED_NO_REFUND: { label: "Résolu (sans remboursement)", color: "text-green-700", bgColor: "bg-green-100", icon: CheckCircleIcon },
  CLOSED: { label: "Fermé", color: "text-gray-700", bgColor: "bg-gray-100", icon: XCircleIcon },
};

const PRIORITY_CONFIG: Record<number, { label: string; color: string }> = {
  1: { label: "Critique", color: "text-red-600 bg-red-100" },
  2: { label: "Haute", color: "text-orange-600 bg-orange-100" },
  3: { label: "Normale", color: "text-blue-600 bg-blue-100" },
  4: { label: "Basse", color: "text-gray-600 bg-gray-100" },
};

const REASON_LABELS: Record<string, string> = {
  PROPERTY_NOT_AS_DESCRIBED: "Logement non conforme",
  HOST_CANCELLED: "Annulation par l'hôte",
  GUEST_BEHAVIOUR: "Comportement du voyageur",
  PAYMENT_ISSUE: "Problème de paiement",
  SAFETY_CONCERN: "Problème de sécurité",
  DAMAGE: "Dommages",
  OTHER: "Autre",
};

export default function AdminDisputeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const disputeId = params.id as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);

  const [dispute, setDispute] = useState<DisputeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [resolution, setResolution] = useState("");
  const [awardedAmount, setAwardedAmount] = useState(0);
  const [noteContent, setNoteContent] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchDispute = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch(`/api/admin/disputes/${disputeId}`, { signal });
      const data = await res.json();
      if (data.dispute) setDispute(data.dispute);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      console.error("Error fetching dispute:", error);
    } finally {
      setLoading(false);
    }
  }, [disputeId]);

  useEffect(() => {
    const controller = new AbortController();
    fetchDispute(controller.signal);
    return () => controller.abort();
  }, [fetchDispute]);

  useEffect(() => {
    if (timelineContainerRef.current) {
      timelineContainerRef.current.scrollTop = timelineContainerRef.current.scrollHeight;
    }
  }, [dispute?.timeline]);

  const handleAction = async (action: string, data?: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/disputes/${disputeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...data }),
      });
      if (res.ok) {
        fetchDispute();
        if (action === "resolve") setShowResolveModal(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    await handleAction("message", { message: newMessage });
    setNewMessage("");
  };

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: "Dispute",
          targetId: disputeId,
          content: noteContent,
        }),
      });
      if (res.ok) {
        fetchDispute();
        setShowNoteModal(false);
        setNoteContent("");
      }
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (cents: number, currency = "EUR") => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
    }).format(cents / 100);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `Il y a ${minutes}m`;
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${days}j`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="text-center py-12">
        <FlagIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Litige non trouvé</h2>
        <Link href="/admin/disputes" className="text-red-600 hover:text-red-700 mt-2 inline-block">
          ← Retour à la liste
        </Link>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[dispute.status] || STATUS_CONFIG.OPEN;
  const StatusIcon = statusConfig.icon;
  const priorityConfig = PRIORITY_CONFIG[dispute.priority] || PRIORITY_CONFIG[3];
  const isResolved = dispute.status.includes("RESOLVED") || dispute.status === "CLOSED";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => router.back()}
          aria-label="Retour a la page precedente"
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg mt-1"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">
              Litige #{dispute.id.slice(-8).toUpperCase()}
            </h1>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
              <StatusIcon className="h-4 w-4" />
              {statusConfig.label}
            </span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${priorityConfig.color}`}>
              Priorité: {priorityConfig.label}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {REASON_LABELS[dispute.reason] || dispute.reason} • Ouvert le {formatDate(dispute.createdAt)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {!dispute.assignedAdmin && (
            <button
              onClick={() => handleAction("assign")}
              disabled={saving}
              aria-label="M'assigner ce litige"
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              <ShieldCheckIcon className="h-5 w-5" />
              M&apos;assigner
            </button>
          )}
          {!isResolved && (
            <>
              <button
                onClick={() => handleAction("escalate")}
                disabled={saving || dispute.status === "ESCALATED"}
                aria-label="Escalader ce litige"
                className="flex items-center gap-2 px-4 py-2 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 disabled:opacity-50"
              >
                <ChevronUpIcon className="h-5 w-5" />
                Escalader
              </button>
              <button
                onClick={() => setShowResolveModal(true)}
                aria-label="Resoudre ce litige"
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                <CheckCircleIcon className="h-5 w-5" />
                Resoudre
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Description du litige</h3>
            <p className="text-gray-600 whitespace-pre-wrap">{dispute.description}</p>
            {dispute.claimedAmountCents && (
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg flex items-center gap-3">
                <CurrencyDollarIcon className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Montant réclamé</p>
                  <p className="text-lg font-bold text-yellow-900">
                    {formatCurrency(dispute.claimedAmountCents)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Timeline</h3>
              <span className="text-sm text-gray-500">{dispute.timeline.length} événements</span>
            </div>

            <div ref={timelineContainerRef} className="max-h-[500px] overflow-y-auto p-4 space-y-4">
              {dispute.timeline.map((item) => (
                <div key={item.id} className="flex gap-3">
                  {/* Avatar / Icon */}
                  <div className="flex-shrink-0">
                    {item.type === "system" || item.type === "admin_action" ? (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <DocumentTextIcon className="h-4 w-4 text-gray-500" />
                      </div>
                    ) : item.type === "evidence" ? (
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <PaperClipIcon className="h-4 w-4 text-blue-600" />
                      </div>
                    ) : item.type === "opened" ? (
                      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                        <FlagIcon className="h-4 w-4 text-red-600" />
                      </div>
                    ) : item.type === "resolved" ? (
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircleIcon className="h-4 w-4 text-green-600" />
                      </div>
                    ) : (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                        item.isAdmin ? "bg-red-500" : "bg-gray-400"
                      }`}>
                        {item.user.name?.charAt(0) || "?"}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className={`flex-1 min-w-0 ${
                    item.type === "admin_message"
                      ? "bg-red-50 border border-red-100 rounded-lg p-3"
                      : item.type === "user_message"
                      ? "bg-gray-50 rounded-lg p-3"
                      : item.type === "system" || item.type === "admin_action"
                      ? "bg-gray-100 rounded-lg p-3 text-sm"
                      : ""
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 text-sm">
                        {item.user.name || "Système"}
                        {item.isAdmin && <span className="ml-1 text-red-600">(Admin)</span>}
                      </span>
                      <span className="text-xs text-gray-400">{formatTimeAgo(item.date)}</span>
                    </div>
                    <p className="text-gray-700 text-sm">{item.content}</p>

                    {/* Evidence file */}
                    {item.type === "evidence" && item.fileUrl && (
                      <a
                        href={item.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                      >
                        {item.fileType?.startsWith("image/") ? (
                          <PhotoIcon className="h-4 w-4" />
                        ) : (
                          <DocumentTextIcon className="h-4 w-4" />
                        )}
                        {item.fileName}
                      </a>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            {!isResolved && (
              <div className="p-4 border-t border-gray-100">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                    placeholder="Envoyer un message..."
                    aria-label="Ecrire un message"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || saving}
                    aria-label="Envoyer le message"
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                  >
                    <PaperAirplaneIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Evidence */}
          {dispute.evidence.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">
                Preuves ({dispute.evidence.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {dispute.evidence.map((ev) => (
                  <a
                    key={ev.id}
                    href={ev.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    {ev.fileType.startsWith("image/") ? (
                      <Image
                        src={ev.fileUrl}
                        alt={ev.fileName}
                        width={200}
                        height={96}
                        className="w-full h-24 object-cover rounded mb-2"
                      />
                    ) : (
                      <div className="w-full h-24 bg-gray-100 rounded mb-2 flex items-center justify-center">
                        <DocumentTextIcon className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <p className="text-sm font-medium text-gray-900 truncate">{ev.fileName}</p>
                    <p className="text-xs text-gray-500">
                      Par {ev.uploadedBy.name || "?"} • {formatTimeAgo(ev.createdAt)}
                    </p>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Admin Notes */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Notes admin</h3>
              <button
                onClick={() => setShowNoteModal(true)}
                aria-label="Ajouter une note"
                className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
              >
                <PlusIcon className="h-4 w-4" />
                Ajouter
              </button>
            </div>
            {dispute.adminNotes.length === 0 ? (
              <p className="text-sm text-gray-500">Aucune note</p>
            ) : (
              <div className="space-y-3">
                {dispute.adminNotes.map((note) => (
                  <div key={note.id} className="p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                    <p className="text-sm text-gray-700">{note.content}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Par {note.author.name || "Admin"} • {formatDateTime(note.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Booking Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Réservation</h3>
            <Link
              href={`/admin/bookings/${dispute.booking.id}`}
              className="flex items-start gap-3 hover:bg-gray-50 -mx-2 p-2 rounded-lg"
            >
              {dispute.coverImage ? (
                <Image src={dispute.coverImage} alt={`Photo de ${dispute.booking.listing.title}`} width={64} height={64} className="w-16 h-16 rounded-lg object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gray-200" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{dispute.booking.listing.title}</p>
                <p className="text-sm text-gray-500">{dispute.booking.listing.city}</p>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {formatCurrency(dispute.booking.totalPrice * 100, dispute.booking.currency)}
                </p>
              </div>
            </Link>
            <div className="mt-3 pt-3 border-t border-gray-100 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Dates</span>
                <span>{formatDate(dispute.booking.startDate)} - {formatDate(dispute.booking.endDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Statut</span>
                <span className={`font-medium ${
                  dispute.booking.status === "CONFIRMED" ? "text-green-600" :
                  dispute.booking.status === "CANCELLED" ? "text-red-600" : "text-yellow-600"
                }`}>
                  {dispute.booking.status}
                </span>
              </div>
            </div>
          </div>

          {/* Parties */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Parties impliquées</h3>

            {/* Opened By */}
            <div className="mb-4">
              <p className="text-xs text-gray-500 uppercase mb-2">Plaignant</p>
              <Link
                href={`/admin/users/${dispute.openedBy.id}`}
                className="flex items-center gap-3 hover:bg-gray-50 -mx-2 p-2 rounded-lg"
              >
                {dispute.openedBy.profile?.avatarUrl ? (
                  <Image src={dispute.openedBy.profile.avatarUrl} alt={`Avatar de ${dispute.openedBy.name || "utilisateur"}`} width={40} height={40} className="w-10 h-10 rounded-full" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                    {dispute.openedBy.name?.charAt(0) || "?"}
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">{dispute.openedBy.name || "Sans nom"}</p>
                  <p className="text-sm text-gray-500">{dispute.openedBy.email}</p>
                </div>
              </Link>
            </div>

            {/* Against */}
            <div>
              <p className="text-xs text-gray-500 uppercase mb-2">Défendeur</p>
              <Link
                href={`/admin/users/${dispute.against.id}`}
                className="flex items-center gap-3 hover:bg-gray-50 -mx-2 p-2 rounded-lg"
              >
                {dispute.against.profile?.avatarUrl ? (
                  <Image src={dispute.against.profile.avatarUrl} alt={`Avatar de ${dispute.against.name || "utilisateur"}`} width={40} height={40} className="w-10 h-10 rounded-full" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-medium">
                    {dispute.against.name?.charAt(0) || "?"}
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">{dispute.against.name || "Sans nom"}</p>
                  <p className="text-sm text-gray-500">{dispute.against.email}</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Assigned Admin */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Admin assigné</h3>
            {dispute.assignedAdmin ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white font-medium">
                  {dispute.assignedAdmin.name?.charAt(0) || "A"}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{dispute.assignedAdmin.name || "Admin"}</p>
                  <p className="text-sm text-gray-500">{dispute.assignedAdmin.email}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <UserCircleIcon className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">Non assigné</p>
                <button
                  onClick={() => handleAction("assign")}
                  disabled={saving}
                  aria-label="M'assigner ce litige"
                  className="mt-2 text-sm text-red-600 hover:text-red-700"
                >
                  M&apos;assigner ce litige
                </button>
              </div>
            )}
          </div>

          {/* Resolution Info */}
          {isResolved && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5" />
                Résolution
              </h3>
              <p className="text-sm text-green-700">{dispute.resolution}</p>
              {dispute.awardedAmountCents && dispute.awardedAmountCents > 0 && (
                <div className="mt-3 pt-3 border-t border-green-200">
                  <p className="text-sm text-green-600">Montant accordé</p>
                  <p className="text-lg font-bold text-green-800">
                    {formatCurrency(dispute.awardedAmountCents)}
                  </p>
                </div>
              )}
              {dispute.resolvedAt && (
                <p className="text-xs text-green-600 mt-3">
                  Résolu le {formatDateTime(dispute.resolvedAt)}
                </p>
              )}
            </div>
          )}

          {/* Priority Selector */}
          {!isResolved && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Priorité</h3>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4].map((p) => (
                  <button
                    key={p}
                    onClick={() => handleAction("update_priority", { priority: p })}
                    disabled={saving || dispute.priority === p}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      dispute.priority === p
                        ? PRIORITY_CONFIG[p].color + " ring-2 ring-offset-1"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {PRIORITY_CONFIG[p].label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resolve Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Resoudre le litige</h3>
              <button onClick={() => setShowResolveModal(false)} aria-label="Fermer la fenetre" className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resolution</label>
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  rows={3}
                  aria-label="Description de la resolution"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="Decrivez la resolution..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant à rembourser (optionnel)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={awardedAmount}
                    onChange={(e) => setAwardedAmount(parseFloat(e.target.value) || 0)}
                    aria-label="Montant a rembourser"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    placeholder="0.00"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                </div>
                {dispute.claimedAmountCents && (
                  <p className="text-xs text-gray-500 mt-1">
                    Montant réclamé: {formatCurrency(dispute.claimedAmountCents)}
                  </p>
                )}
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => handleAction("close", { resolution: resolution || "Ferme sans suite" })}
                  disabled={saving}
                  aria-label="Fermer sans suite"
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Fermer sans suite
                </button>
                <button
                  onClick={() => handleAction("resolve", {
                    resolution,
                    awardedAmount: Math.round(awardedAmount * 100),
                  })}
                  disabled={!resolution.trim() || saving}
                  aria-label="Resoudre le litige"
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                >
                  {saving ? "..." : "Resoudre"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Ajouter une note</h3>
              <button onClick={() => setShowNoteModal(false)} aria-label="Fermer la fenetre" className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={4}
                aria-label="Contenu de la note"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                placeholder="Ecrivez votre note..."
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowNoteModal(false)}
                  aria-label="Annuler"
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddNote}
                  disabled={!noteContent.trim() || saving}
                  aria-label="Ajouter la note"
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                >
                  {saving ? "..." : "Ajouter"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

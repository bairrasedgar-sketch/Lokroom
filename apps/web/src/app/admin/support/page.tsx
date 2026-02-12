"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
import { logger } from "@/lib/logger";

  ChatBubbleLeftRightIcon,
  ClockIcon,
  CheckCircleIcon,
  UserCircleIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

type SupportConversation = {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  assignedAdminId: string | null;
  assignedAdmin: {
    id: string;
    name: string | null;
  } | null;
  status: "WITH_AI" | "WAITING_AGENT" | "WITH_AGENT" | "RESOLVED" | "CLOSED";
  subject: string | null;
  priority: number;
  createdAt: string;
  updatedAt: string;
  _count: {
    messages: number;
  };
};

export default function AdminSupportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "waiting" | "mine" | "resolved">("waiting");

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/support/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      logger.error("Error fetching support conversations:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchConversations();
      const interval = setInterval(fetchConversations, 10000);
      return () => clearInterval(interval);
    }
  }, [status, fetchConversations]);

  useEffect(() => {
    const user = session?.user as { id?: string; role?: string } | undefined;
    if (status === "authenticated" && user?.role !== "ADMIN") {
      router.push("/");
    }
  }, [status, session, router]);

  const filteredConversations = conversations.filter((conv) => {
    if (filter === "waiting" && conv.status !== "WAITING_AGENT") return false;
    if (filter === "mine" && conv.assignedAdminId !== session?.user?.id) return false;
    if (filter === "resolved" && !["RESOLVED", "CLOSED"].includes(conv.status)) return false;
    return true;
  });

  const waitingCount = conversations.filter((c) => c.status === "WAITING_AGENT").length;
  const myCount = conversations.filter((c) => c.assignedAdminId === session?.user?.id && c.status === "WITH_AGENT").length;
  const resolvedCount = conversations.filter((c) => ["RESOLVED", "CLOSED"].includes(c.status)).length;

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays === 1) return "Hier";
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "WITH_AI":
        return { label: "Avec IA", cls: "bg-violet-100 text-violet-700", Icon: SparklesIcon };
      case "WAITING_AGENT":
        return { label: "En attente", cls: "bg-amber-100 text-amber-700", Icon: ClockIcon };
      case "WITH_AGENT":
        return { label: "En cours", cls: "bg-emerald-100 text-emerald-700", Icon: UserCircleIcon };
      case "RESOLVED":
        return { label: "Résolu", cls: "bg-blue-100 text-blue-700", Icon: CheckCircleIcon };
      default:
        return { label: "Fermé", cls: "bg-gray-100 text-gray-600", Icon: CheckCircleIcon };
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Support utilisateurs</h1>
          <p className="text-sm text-gray-500">Gérez les demandes d'aide</p>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
              <ClockIcon className="h-4 w-4 text-amber-600" />
            </span>
            <div>
              <p className="font-semibold text-gray-900">{waitingCount}</p>
              <p className="text-xs text-gray-500">En attente</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
              <UserCircleIcon className="h-4 w-4 text-emerald-600" />
            </span>
            <div>
              <p className="font-semibold text-gray-900">{myCount}</p>
              <p className="text-xs text-gray-500">Mes conv.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
              <ChatBubbleLeftRightIcon className="h-4 w-4 text-gray-600" />
            </span>
            <div>
              <p className="font-semibold text-gray-900">{conversations.length}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { id: "waiting" as const, label: "En attente", count: waitingCount },
          { id: "mine" as const, label: "Mes conversations", count: myCount },
          { id: "all" as const, label: "Toutes", count: conversations.length },
          { id: "resolved" as const, label: "Résolues", count: resolvedCount },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === tab.id
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-1.5 ${filter === tab.id ? "text-gray-300" : "text-gray-400"}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full min-w-[600px]">
          <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Utilisateur</th>
              <th className="px-4 py-3">Sujet</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Assigné à</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Msg</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredConversations.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-500">
                  Aucune conversation
                </td>
              </tr>
            ) : (
              filteredConversations.map((conv) => {
                const badge = getStatusBadge(conv.status);
                return (
                  <tr key={conv.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/support/${conv.id}`} className="block">
                        <p className="font-medium text-gray-900">{conv.user.name || "Sans nom"}</p>
                        <p className="text-xs text-gray-500">{conv.user.email}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/support/${conv.id}`}>
                        <p className="max-w-[200px] truncate text-sm text-gray-700">
                          {conv.subject || "-"}
                        </p>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ${badge.cls}`}>
                        <badge.Icon className="h-3 w-3" />
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {conv.assignedAdmin?.name || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatRelativeTime(conv.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-500">
                      {conv._count.messages}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

"use client";

import { CheckIcon } from "@heroicons/react/24/solid";
import { CheckIcon as CheckOutline } from "@heroicons/react/24/outline";

type ReadReceiptProps = {
  senderId: string;
  currentUserId: string;
  isLastMessage: boolean;
  readBy: Array<{
    userId: string;
    readAt: string;
  }>;
};

export default function ReadReceipt({
  senderId,
  currentUserId,
  isLastMessage,
  readBy,
}: ReadReceiptProps) {
  // Seulement afficher pour les messages de l'utilisateur actuel
  if (senderId !== currentUserId) return null;

  // Seulement afficher sur le dernier message
  if (!isLastMessage) return null;

  // Vérifier si quelqu'un d'autre a lu
  const othersWhoRead = readBy.filter((r) => r.userId !== currentUserId);
  const isRead = othersWhoRead.length > 0;

  return (
    <div className="flex items-center gap-0.5 mt-1">
      {isRead ? (
        // Double check bleu - Lu
        <>
          <CheckIcon className="h-3 w-3 text-blue-500" />
          <CheckIcon className="h-3 w-3 -ml-1.5 text-blue-500" />
        </>
      ) : (
        // Double check gris - Envoyé mais pas lu
        <>
          <CheckOutline className="h-3 w-3 text-gray-400" />
          <CheckOutline className="h-3 w-3 -ml-1.5 text-gray-400" />
        </>
      )}
    </div>
  );
}

// Version simplifiée avec juste l'icône
export function ReadStatus({ isRead }: { isRead: boolean }) {
  return (
    <span className="inline-flex items-center">
      {isRead ? (
        <span className="flex items-center text-blue-500">
          <CheckIcon className="h-3 w-3" />
          <CheckIcon className="h-3 w-3 -ml-1.5" />
        </span>
      ) : (
        <span className="flex items-center text-gray-400">
          <CheckOutline className="h-3 w-3" />
          <CheckOutline className="h-3 w-3 -ml-1.5" />
        </span>
      )}
    </span>
  );
}

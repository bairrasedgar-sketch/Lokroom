"use client";

import { motion } from "framer-motion";
import { MessageCircle, X } from "lucide-react";

interface ChatButtonProps {
  isOpen: boolean;
  onClick: () => void;
  hasUnread?: boolean;
}

export default function ChatButton({ isOpen, onClick, hasUnread }: ChatButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-[9997] w-14 h-14 bg-black text-white rounded-full shadow-2xl hover:bg-gray-800 transition-colors flex items-center justify-center group"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={isOpen ? "Fermer le chat" : "Ouvrir le chat"}
    >
      <motion.div
        initial={false}
        animate={{ rotate: isOpen ? 90 : 0 }}
        transition={{ duration: 0.2 }}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </motion.div>

      {/* Unread indicator */}
      {hasUnread && !isOpen && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"
        />
      )}

      {/* Pulse animation when closed */}
      {!isOpen && (
        <motion.div
          className="absolute inset-0 bg-black rounded-full"
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 1,
          }}
        />
      )}
    </motion.button>
  );
}

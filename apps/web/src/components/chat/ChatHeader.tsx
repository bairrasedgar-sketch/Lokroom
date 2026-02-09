import { X, Minimize2 } from "lucide-react";

interface ChatHeaderProps {
  onClose: () => void;
}

export default function ChatHeader({ onClose }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 bg-black text-white rounded-t-2xl">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
          <span className="text-black font-bold text-lg">L</span>
        </div>
        <div>
          <h3 className="font-semibold text-base">Lok&apos;Room Support</h3>
          <p className="text-xs text-gray-300">En ligne</p>
        </div>
      </div>
      <button
        onClick={onClose}
        className="p-2 hover:bg-white/10 rounded-full transition-colors"
        aria-label="Fermer le chat"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

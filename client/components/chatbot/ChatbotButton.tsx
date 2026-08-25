"use client";

import React from "react";
import { motion } from "framer-motion";
import { BiSolidDroplet } from "react-icons/bi";
import { FiX } from "react-icons/fi";

interface ChatbotButtonProps {
  isOpen: boolean;
  onClick: () => void;
  unreadCount?: number;
}

export const ChatbotButton: React.FC<ChatbotButtonProps> = ({
  isOpen,
  onClick,
  unreadCount = 0,
}) => {
  return (
    <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50">
      <motion.button
        id="bloodlink-chatbot-toggle"
        onClick={onClick}
        aria-expanded={isOpen}
        aria-controls="bloodlink-chat-window"
        aria-label={isOpen ? "Close BloodLink Assistant" : "Open BloodLink Assistant"}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className={`relative flex items-center justify-center w-14 h-14 rounded-full shadow-xl transition-colors cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-red-400 ${
          isOpen
            ? "bg-slate-800 dark:bg-slate-700 text-white shadow-slate-900/20"
            : "bg-gradient-to-tr from-red-700 via-red-600 to-rose-500 text-white shadow-red-600/30"
        }`}
      >
        {/* Pulsing Ping Ring when closed */}
        {!isOpen && (
          <span className="absolute -inset-1 rounded-full bg-red-500/30 animate-ping pointer-events-none" />
        )}

        {/* Inner Icon */}
        <motion.div
          key={isOpen ? "close" : "open"}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 90, opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="relative z-10 flex items-center justify-center"
        >
          {isOpen ? (
            <FiX size={24} />
          ) : (
            <BiSolidDroplet size={26} className="drop-shadow-sm" />
          )}
        </motion.div>

        {/* Badge when closed and unread */}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-amber-400 text-slate-900 text-[10px] font-extrabold shadow-md border-2 border-white dark:border-slate-900">
            {unreadCount}
          </span>
        )}

        {/* Helper Tooltip on Desktop hover */}
        {!isOpen && (
          <span className="hidden lg:block absolute right-16 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-slate-900/90 dark:bg-slate-800 text-white text-xs font-medium whitespace-nowrap shadow-lg opacity-0 hover:opacity-100 transition-opacity pointer-events-none backdrop-blur-xs">
            💬 Need help? Ask BloodLink Assistant!
          </span>
        )}
      </motion.button>
    </div>
  );
};
export default ChatbotButton;

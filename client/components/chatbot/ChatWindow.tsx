"use client";

import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatMessage } from "@/types/chatbot";
import ChatMessageItem from "./ChatMessage";
import QuickQuestions from "./QuickQuestions";
import { FiSend, FiTrash2, FiX, FiRefreshCw } from "react-icons/fi";
import { BiSolidDroplet } from "react-icons/bi";

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  isTyping: boolean;
  inputValue: string;
  onInputChange: (val: string) => void;
  onSendMessage: (query?: string) => void;
  onClearChat: () => void;
  onQuickReplyClick: (query: string) => void;
  error?: string | null;
  onRetry?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  isOpen,
  onClose,
  messages,
  isTyping,
  inputValue,
  onInputChange,
  onSendMessage,
  onClearChat,
  onQuickReplyClick,
  error,
  onRetry,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // Focus input when opened
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, messages, isTyping]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim() && !isTyping) {
        onSendMessage();
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isTyping) {
      onSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        id="bloodlink-chat-window"
        role="dialog"
        aria-modal="true"
        aria-label="BloodLink Assistant Chat Window"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
        className="fixed z-50 bottom-22 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[400px] h-[580px] max-h-[calc(100vh-7rem)] flex flex-col bg-white dark:bg-slate-950 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800/90 overflow-hidden"
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="relative flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md select-none shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-full bg-white/15 backdrop-blur-xs border border-white/20 shadow-inner shrink-0">
              <BiSolidDroplet size={18} className="text-white drop-shadow-sm" />
              {/* Online Green Dot */}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-red-600" />
            </div>

            <div className="flex flex-col min-w-0">
              <h2 className="text-sm font-bold tracking-tight text-white truncate leading-tight flex items-center gap-1.5">
                BloodLink Assistant
                <span className="text-[10px] font-semibold bg-white/20 px-1.5 py-0.2 rounded text-white/90">
                  AI
                </span>
              </h2>
              <p className="text-[11px] text-white/80 truncate leading-tight">
                Live Blood & Emergency Helper
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Clear Chat Button */}
            <button
              onClick={onClearChat}
              title="Clear chat history"
              aria-label="Clear chat history"
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
            >
              <FiTrash2 size={16} />
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              title="Close Assistant"
              aria-label="Close Assistant"
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
            >
              <FiX size={18} />
            </button>
          </div>
        </header>

        {/* ── Message Thread ──────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3.5 bg-slate-50/50 dark:bg-slate-900/40 overscroll-contain">
          {/* Welcome header if few messages */}
          {messages.length <= 1 && (
            <div className="my-1">
              <QuickQuestions onSelect={onQuickReplyClick} />
            </div>
          )}

          {/* Render Messages */}
          {messages.map((msg) => (
            <ChatMessageItem
              key={msg.id}
              message={msg}
              onQuickReplyClick={onQuickReplyClick}
            />
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-end gap-2 max-w-[80%]">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-red-600 to-red-500 text-white flex items-center justify-center shrink-0 text-xs shadow-sm">
                <BiSolidDroplet size={14} className="animate-pulse" />
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl rounded-bl-xs shadow-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-center justify-between gap-2">
              <span>{error}</span>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="inline-flex items-center gap-1 font-semibold underline hover:text-red-900 dark:hover:text-red-100 cursor-pointer"
                >
                  <FiRefreshCw size={12} /> Retry
                </button>
              )}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Input Bar ──────────────────────────────────────────────────── */}
        <footer className="p-3 bg-white dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800/80 shrink-0">
          <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about blood, donation, emergency..."
              disabled={isTyping}
              className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/80 transition-all"
            />

            <button
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              aria-label="Send message"
              className="w-10 h-10 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:hover:bg-red-600 text-white flex items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed shadow-md shrink-0 active:scale-95"
            >
              <FiSend size={16} />
            </button>
          </form>

          {/* Safety Disclaimer Subtitle */}
          <p className="mt-2 text-[10px] text-center text-slate-400 dark:text-slate-500 leading-tight">
            Informational assistance only. For medical emergencies, call 112 / 108.
          </p>
        </footer>
      </motion.div>
    </AnimatePresence>
  );
};
export default ChatWindow;

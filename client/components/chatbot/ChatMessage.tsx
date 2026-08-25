"use client";

import React from "react";
import Link from "next/link";
import { ChatMessage as ChatMessageType } from "@/types/chatbot";
import { FiUser } from "react-icons/fi";
import { BiSolidDroplet } from "react-icons/bi";

interface ChatMessageProps {
  message: ChatMessageType;
  onQuickReplyClick?: (query: string) => void;
}

/**
 * Format markdown-like text elements (bold, bullet points, links, alerts) into React nodes
 */
function renderFormattedContent(text: string) {
  const lines = text.split("\n");

  return lines.map((line, idx) => {
    // Empty line spacer
    if (!line.trim()) {
      return <div key={idx} className="h-2" />;
    }

    // Markdown Alert / Blockquote
    if (line.startsWith("> ")) {
      const alertText = line.replace(/^>\s*/, "");
      return (
        <div
          key={idx}
          className="my-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border-l-3 border-amber-500 text-xs text-amber-900 dark:text-amber-200"
        >
          {parseInlineFormatting(alertText)}
        </div>
      );
    }

    // Table rows
    if (line.startsWith("|")) {
      const cols = line
        .split("|")
        .map((c) => c.trim())
        .filter((c) => c.length > 0);

      if (line.includes("---")) {
        return null; // Header divider
      }

      return (
        <div
          key={idx}
          className="grid grid-cols-3 gap-1 py-1 text-xs border-b border-slate-200 dark:border-slate-800 last:border-0 font-medium"
        >
          {cols.map((col, cIdx) => (
            <span key={cIdx} className={cIdx === 0 ? "font-bold text-red-600 dark:text-red-400" : ""}>
              {parseInlineFormatting(col)}
            </span>
          ))}
        </div>
      );
    }

    // Bullet line
    if (line.startsWith("• ") || line.startsWith("- ")) {
      const bulletContent = line.replace(/^[•-]\s*/, "");
      return (
        <div key={idx} className="flex items-start gap-1.5 my-1 text-xs sm:text-sm">
          <span className="text-red-500 font-bold leading-tight mt-0.5">•</span>
          <span className="flex-1">{parseInlineFormatting(bulletContent)}</span>
        </div>
      );
    }

    // Numbered line
    if (/^\d+\.\s/.test(line)) {
      const numMatch = line.match(/^(\d+\.)\s*(.*)$/);
      if (numMatch) {
        return (
          <div key={idx} className="flex items-start gap-1.5 my-1 text-xs sm:text-sm">
            <span className="font-semibold text-red-600 dark:text-red-400 text-xs">{numMatch[1]}</span>
            <span className="flex-1">{parseInlineFormatting(numMatch[2])}</span>
          </div>
        );
      }
    }

    // Standard paragraph line
    return (
      <p key={idx} className="my-0.5 text-xs sm:text-sm leading-relaxed">
        {parseInlineFormatting(line)}
      </p>
    );
  });
}

/**
 * Parses inline bold, italics, code, and links
 */
function parseInlineFormatting(str: string): React.ReactNode {
  // Regex to split by bold **text**, links [text](url), or italic *text*
  const parts: React.ReactNode[] = [];
  let remaining = str;
  let keyIdx = 0;

  while (remaining.length > 0) {
    // Match markdown links [Label](url)
    const linkMatch = remaining.match(/\[(.*?)\]\((.*?)\)/);
    // Match bold **text**
    const boldMatch = remaining.match(/\*\*(.*?)\*\*/);
    // Match italic *text*
    const italicMatch = remaining.match(/\*(.*?)\*/);

    let earliestIndex = -1;
    let matchType: "link" | "bold" | "italic" | null = null;
    let bestMatch: RegExpMatchArray | null = null;

    if (linkMatch && (earliestIndex === -1 || (linkMatch.index ?? 9999) < earliestIndex)) {
      earliestIndex = linkMatch.index ?? 0;
      matchType = "link";
      bestMatch = linkMatch;
    }
    if (boldMatch && (earliestIndex === -1 || (boldMatch.index ?? 9999) < earliestIndex)) {
      earliestIndex = boldMatch.index ?? 0;
      matchType = "bold";
      bestMatch = boldMatch;
    }
    if (italicMatch && (earliestIndex === -1 || (italicMatch.index ?? 9999) < earliestIndex)) {
      earliestIndex = italicMatch.index ?? 0;
      matchType = "italic";
      bestMatch = italicMatch;
    }

    if (earliestIndex === -1 || !matchType || !bestMatch) {
      parts.push(remaining);
      break;
    }

    if (earliestIndex > 0) {
      parts.push(remaining.substring(0, earliestIndex));
    }

    if (matchType === "link") {
      const [, label, url] = bestMatch;
      parts.push(
        <Link
          key={keyIdx++}
          href={url}
          className="text-red-600 dark:text-red-400 font-semibold underline underline-offset-2 hover:text-red-700"
        >
          {label}
        </Link>
      );
    } else if (matchType === "bold") {
      parts.push(
        <strong key={keyIdx++} className="font-semibold text-slate-900 dark:text-white">
          {bestMatch[1]}
        </strong>
      );
    } else if (matchType === "italic") {
      parts.push(
        <em key={keyIdx++} className="italic text-slate-600 dark:text-slate-400">
          {bestMatch[1]}
        </em>
      );
    }

    remaining = remaining.substring(earliestIndex + bestMatch[0].length);
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

export const ChatMessageItem: React.FC<ChatMessageProps> = ({ message, onQuickReplyClick }) => {
  const isUser = message.sender === "user";

  return (
    <div
      className={`flex flex-col gap-1.5 w-full ${
        isUser ? "items-end" : "items-start"
      }`}
    >
      <div className={`flex items-end gap-2 max-w-[88%] sm:max-w-[84%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        {/* Avatar */}
        <div
          className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs shadow-sm ${
            isUser
              ? "bg-red-600 text-white ring-2 ring-red-200 dark:ring-red-950"
              : "bg-gradient-to-tr from-red-600 to-red-500 text-white"
          }`}
          aria-hidden="true"
        >
          {isUser ? <FiUser size={13} /> : <BiSolidDroplet size={14} className="animate-pulse" />}
        </div>

        {/* Bubble */}
        <div
          className={`p-3.5 text-xs sm:text-sm leading-relaxed shadow-sm transition-all ${
            isUser
              ? "bg-red-600 text-white rounded-2xl rounded-br-xs font-medium"
              : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-800 rounded-2xl rounded-bl-xs"
          }`}
        >
          {renderFormattedContent(message.text)}
        </div>
      </div>

      {/* Quick Reply Pills */}
      {!isUser && message.quickReplies && message.quickReplies.length > 0 && onQuickReplyClick && (
        <div className="flex flex-wrap gap-1.5 pl-9 mt-1 max-w-full">
          {message.quickReplies.map((reply, rIdx) => (
            <button
              key={rIdx}
              onClick={() => onQuickReplyClick(reply)}
              className="inline-flex items-center text-xs px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200/80 dark:border-red-900/60 hover:bg-red-100 dark:hover:bg-red-900/60 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-2xs font-medium"
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* Timestamp */}
      <span
        className={`text-[10px] text-slate-400 dark:text-slate-500 px-9 ${
          isUser ? "text-right" : "text-left"
        }`}
      >
        {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </span>
    </div>
  );
};
export default ChatMessageItem;

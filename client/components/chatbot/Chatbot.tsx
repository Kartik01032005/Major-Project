"use client";

import React, { useState, useCallback, useEffect } from "react";
import { ChatMessage, ChatbotCategory } from "@/types/chatbot";
import { chatbotService, getWelcomeMessage } from "@/services/chatbotService";
import { useLanguage } from "@/context/LanguageContext";
import ChatbotButton from "./ChatbotButton";
import ChatWindow from "./ChatWindow";

export const Chatbot: React.FC = () => {
  const { locale } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [getWelcomeMessage(locale)]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState<string>("");

  // Load chat session if available
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = sessionStorage.getItem("bloodlink_chat_session");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(
              parsed.map((m: Record<string, unknown>) => ({
                id: String(m.id ?? `msg-${Date.now()}`),
                sender: (m.sender as "user" | "assistant" | "system") ?? "assistant",
                text: String(m.text ?? ""),
                timestamp: m.timestamp ? new Date(String(m.timestamp)) : new Date(),
                quickReplies: Array.isArray(m.quickReplies) ? (m.quickReplies as string[]) : undefined,
                category: (m.category as ChatbotCategory) ?? undefined,
              }))
            );
          }
        }
      } catch {
        // Ignore sessionStorage errors
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  // Save chat session on update
  const saveSession = useCallback((updatedMessages: ChatMessage[]) => {
    try {
      sessionStorage.setItem("bloodlink_chat_session", JSON.stringify(updatedMessages));
    } catch {
      // Ignore
    }
  }, []);

  const handleSendMessage = useCallback(
    async (queryToSend?: string) => {
      const text = (queryToSend ?? inputValue).trim();
      if (!text || isTyping) return;

      setError(null);
      setLastQuery(text);
      setInputValue("");

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        sender: "user",
        text,
        timestamp: new Date(),
      };

      const updatedWithUser = [...messages, userMsg];
      setMessages(updatedWithUser);
      saveSession(updatedWithUser);
      setIsTyping(true);

      try {
        const botReply = await chatbotService.processMessage(text, updatedWithUser, locale);
        const updatedWithBot = [...updatedWithUser, botReply];
        setMessages(updatedWithBot);
        saveSession(updatedWithBot);
      } catch (err: unknown) {
        console.error("Chatbot processing error:", err);
        setError("Failed to get a response. Please check your connection and try again.");
      } finally {
        setIsTyping(false);
      }
    },
    [inputValue, isTyping, locale, messages, saveSession]
  );

  const handleQuickReplyClick = useCallback(
    (query: string) => {
      handleSendMessage(query);
    },
    [handleSendMessage]
  );

  const handleClearChat = useCallback(() => {
    setMessages([getWelcomeMessage(locale)]);
    setError(null);
    try {
      sessionStorage.removeItem("bloodlink_chat_session");
    } catch {
      // Ignore
    }
  }, [locale]);

  const handleRetry = useCallback(() => {
    if (lastQuery) {
      handleSendMessage(lastQuery);
    }
  }, [handleSendMessage, lastQuery]);

  return (
    <>
      <ChatbotButton
        isOpen={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
      />

      <ChatWindow
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        messages={messages}
        isTyping={isTyping}
        inputValue={inputValue}
        onInputChange={setInputValue}
        onSendMessage={handleSendMessage}
        onClearChat={handleClearChat}
        onQuickReplyClick={handleQuickReplyClick}
        error={error}
        onRetry={handleRetry}
      />
    </>
  );
};
export default Chatbot;

export type MessageSender = "user" | "assistant" | "system";

export type ChatbotCategory =
  | "compatibility"
  | "donation"
  | "emergency"
  | "hospitals"
  | "features"
  | "general";

export interface ChatMessage {
  id: string;
  sender: MessageSender;
  text: string;
  timestamp: Date;
  quickReplies?: string[];
  isError?: boolean;
  category?: ChatbotCategory;
}

export interface QuickQuestion {
  id: string;
  label: string;
  query: string;
  category: ChatbotCategory;
  icon?: string;
}

export interface ChatbotState {
  isOpen: boolean;
  messages: ChatMessage[];
  isTyping: boolean;
  inputValue: string;
}

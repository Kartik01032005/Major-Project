"use client";

import React from "react";
import { QuickQuestion } from "@/types/chatbot";
import { DEFAULT_QUICK_QUESTIONS } from "@/services/chatbotService";

interface QuickQuestionsProps {
  onSelect: (query: string) => void;
  questions?: QuickQuestion[];
}

export const QuickQuestions: React.FC<QuickQuestionsProps> = ({
  onSelect,
  questions = DEFAULT_QUICK_QUESTIONS,
}) => {
  return (
    <div className="w-full py-2">
      <p className="text-[11px] font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500 mb-2 px-1">
        Suggested Topics
      </p>
      <div className="flex flex-wrap gap-1.5">
        {questions.map((q) => (
          <button
            key={q.id}
            onClick={() => onSelect(q.query)}
            className="inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/70 hover:border-red-400 dark:hover:border-red-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-all duration-150 active:scale-[0.97] cursor-pointer shadow-2xs"
          >
            {q.label}
          </button>
        ))}
      </div>
    </div>
  );
};
export default QuickQuestions;

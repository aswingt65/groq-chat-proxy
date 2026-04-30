"use client";

import { useState, FormEvent, KeyboardEvent } from "react";

interface Props {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: Props) {
  const [input, setInput] = useState("");

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || disabled) return;
    onSend(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 p-4 bg-surface-900/80 backdrop-blur-md border-t border-surface-800"
    >
      <div className="flex-1 relative">
        <textarea
          id="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Shift+Enter for new line)"
          disabled={disabled}
          rows={1}
          className="w-full px-4 py-3 rounded-xl bg-surface-800 border border-surface-700/50 text-surface-100 placeholder-surface-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 resize-none text-sm transition-all disabled:opacity-50 min-h-[44px] max-h-[160px]"
          style={{ height: "auto" }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "auto";
            target.style.height = Math.min(target.scrollHeight, 160) + "px";
          }}
        />
      </div>
      <button
        id="send-button"
        type="submit"
        disabled={!input.trim() || disabled}
        className="h-11 w-11 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white flex items-center justify-center hover:from-primary-500 hover:to-primary-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary-600/20 shrink-0 cursor-pointer"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
          />
        </svg>
      </button>
    </form>
  );
}

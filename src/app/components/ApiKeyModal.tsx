"use client";
import { useState } from "react";

interface Props {
  onSubmit: (key: string) => void;
  initialKey?: string;
}

export default function ApiKeyModal({ onSubmit, initialKey = "" }: Props) {
  const [key, setKey] = useState(initialKey);
  const [show, setShow] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in-up">
      <div className="w-full max-w-md mx-4 rounded-2xl border border-surface-700/50 bg-surface-900/95 p-8 shadow-2xl">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary-500/20">
            G
          </div>
          <div>
            <h1 className="text-xl font-bold text-surface-50">Groq Gateway</h1>
            <p className="text-xs text-surface-400">AI Chat Proxy</p>
          </div>
        </div>

        <p className="text-sm text-surface-300 mb-6 leading-relaxed">
          Enter your Groq API key to get started. Your key is stored only in
          your browser and sent securely through our proxy to bypass DNS
          restrictions.
        </p>

        <div className="relative mb-4">
          <input
            id="api-key-input"
            type={show ? "text" : "password"}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="gsk_xxxxxxxxxxxxxxxxxxxxxxxx"
            className="w-full px-4 py-3 pr-20 rounded-xl bg-surface-800 border border-surface-600/50 text-surface-100 placeholder-surface-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 font-mono text-sm transition-all"
            onKeyDown={(e) => {
              if (e.key === "Enter" && key.trim()) onSubmit(key.trim());
            }}
          />
          <button
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-surface-400 hover:text-surface-200 transition-colors px-2 py-1 rounded-md hover:bg-surface-700"
          >
            {show ? "Hide" : "Show"}
          </button>
        </div>

        <button
          id="connect-button"
          onClick={() => key.trim() && onSubmit(key.trim())}
          disabled={!key.trim()}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold text-sm hover:from-primary-500 hover:to-primary-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary-600/20 hover:shadow-primary-500/30 cursor-pointer"
        >
          Connect to Groq
        </button>

        <div className="mt-6 flex items-start gap-2 text-xs text-surface-500">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>
            Your API key never leaves your browser except to make authenticated
            requests through our serverless proxy.
          </span>
        </div>
      </div>
    </div>
  );
}

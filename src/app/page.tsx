"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ApiKeyModal from "./components/ApiKeyModal";
import ChatMessage from "./components/ChatMessage";
import ChatInput from "./components/ChatInput";
import ModelSelector from "./components/ModelSelector";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

const DEFAULT_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "mixtral-8x7b-32768",
  "gemma2-9b-it",
];

export default function Home() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [models, setModels] = useState<string[]>(DEFAULT_MODELS);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODELS[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4096);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load key from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("groq_api_key");
    if (saved) {
      setApiKey(saved);
    }
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Fetch models when key is set
  useEffect(() => {
    if (!apiKey) return;
    setModelsLoading(true);
    fetch("/api/groq/models", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.data && Array.isArray(data.data)) {
          const ids = data.data
            .map((m: { id: string }) => m.id)
            .sort();
          setModels(ids.length > 0 ? ids : DEFAULT_MODELS);
          if (ids.length > 0 && !ids.includes(selectedModel)) {
            setSelectedModel(ids[0]);
          }
        }
      })
      .catch(() => {})
      .finally(() => setModelsLoading(false));
  }, [apiKey]);

  const handleConnect = (key: string) => {
    localStorage.setItem("groq_api_key", key);
    setApiKey(key);
  };

  const handleDisconnect = () => {
    localStorage.removeItem("groq_api_key");
    setApiKey(null);
    setMessages([]);
    setError(null);
  };

  const handleSend = useCallback(
    async (content: string) => {
      if (!apiKey || isStreaming) return;
      setError(null);

      const userMsg: Message = { role: "user", content };
      const history = [...messages, userMsg];
      setMessages(history);

      const assistantMsg: Message = { role: "assistant", content: "" };
      setMessages([...history, assistantMsg]);
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const payload: Record<string, unknown> = {
          model: selectedModel,
          messages: [
            ...(systemPrompt
              ? [{ role: "system", content: systemPrompt }]
              : []),
            ...history.map((m) => ({ role: m.role, content: m.content })),
          ],
          temperature,
          max_tokens: maxTokens,
          stream: true,
        };

        const res = await fetch("/api/groq/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey, payload }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || `HTTP ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n").filter((l) => l.trim());

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") break;

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                accumulated += delta;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: accumulated,
                  };
                  return updated;
                });
              }
            } catch {}
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        const msg = err instanceof Error ? err.message : "Unknown error";
        setError(msg);
        setMessages((prev) => prev.slice(0, -1)); // Remove empty assistant msg
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [apiKey, isStreaming, messages, selectedModel, systemPrompt, temperature, maxTokens]
  );

  const handleStop = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
  };

  const handleClear = () => {
    setMessages([]);
    setError(null);
  };

  // Show API key modal if not connected
  if (!apiKey) {
    return <ApiKeyModal onSubmit={handleConnect} />;
  }

  return (
    <div className="h-screen flex flex-col bg-surface-950">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-surface-800 bg-surface-900/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary-500/20">
            G
          </div>
          <div>
            <h1 className="text-sm font-bold text-surface-50">Groq Gateway</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success-400 pulse-dot" />
              <span className="text-[10px] text-surface-400">Connected</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ModelSelector
            models={models}
            selected={selectedModel}
            onSelect={setSelectedModel}
            loading={modelsLoading}
          />
          <button
            id="settings-toggle"
            onClick={() => setShowSettings(!showSettings)}
            className={`h-9 w-9 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
              showSettings
                ? "bg-primary-600/20 border-primary-500/40 text-primary-400"
                : "bg-surface-800 border-surface-700/50 text-surface-400 hover:text-surface-200 hover:border-surface-600"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button
            id="clear-chat"
            onClick={handleClear}
            className="h-9 w-9 rounded-lg bg-surface-800 border border-surface-700/50 text-surface-400 hover:text-surface-200 hover:border-surface-600 flex items-center justify-center transition-all cursor-pointer"
            title="Clear chat"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <button
            id="disconnect-button"
            onClick={handleDisconnect}
            className="h-9 px-3 rounded-lg bg-surface-800 border border-surface-700/50 text-surface-400 hover:text-red-400 hover:border-red-500/40 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Disconnect
          </button>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className="px-4 py-3 border-b border-surface-800 bg-surface-900/60 animate-fade-in-up shrink-0">
          <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
              <label className="text-xs font-medium text-surface-400 mb-1 block">System Prompt</label>
              <textarea
                id="system-prompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="You are a helpful assistant..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700/50 text-surface-200 placeholder-surface-500 text-xs focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 resize-none transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-surface-400 mb-1 block">
                Temperature: {temperature}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-primary-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-surface-400 mb-1 block">
                Max Tokens: {maxTokens}
              </label>
              <input
                type="range"
                min="256"
                max="32768"
                step="256"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                className="w-full accent-primary-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-2xl mb-6 shadow-2xl shadow-primary-500/30">
              G
            </div>
            <h2 className="text-2xl font-bold text-surface-100 mb-2">
              Ready to chat
            </h2>
            <p className="text-surface-400 text-sm text-center max-w-md mb-8">
              Using <span className="text-primary-400 font-medium">{selectedModel}</span>. 
              Send a message to start your conversation with Groq&apos;s lightning-fast AI.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
              {[
                "Explain quantum computing in simple terms",
                "Write a Python function to sort a list",
                "What are the benefits of Rust over C++?",
                "Create a haiku about programming",
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  className="text-left px-4 py-3 rounded-xl bg-surface-800/60 border border-surface-700/40 text-surface-300 text-xs hover:bg-surface-800 hover:border-surface-600 hover:text-surface-100 transition-all cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto py-6 px-4 space-y-4">
            {messages.map((msg, i) => (
              <ChatMessage
                key={i}
                message={msg}
                isStreaming={isStreaming && i === messages.length - 1 && msg.role === "assistant"}
              />
            ))}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/20">
          <div className="max-w-3xl mx-auto flex items-center gap-2 text-xs text-red-400">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300 cursor-pointer">✕</button>
          </div>
        </div>
      )}

      {/* Stop button */}
      {isStreaming && (
        <div className="flex justify-center py-2 bg-surface-950">
          <button
            id="stop-button"
            onClick={handleStop}
            className="px-4 py-1.5 rounded-lg bg-surface-800 border border-surface-700/50 text-surface-300 text-xs hover:bg-surface-700 hover:text-surface-100 transition-all cursor-pointer flex items-center gap-2"
          >
            <span className="w-2.5 h-2.5 rounded-sm bg-red-400" />
            Stop generating
          </button>
        </div>
      )}

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={isStreaming} />
    </div>
  );
}

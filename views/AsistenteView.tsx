"use client";

import { useEffect, useRef, useState } from "react";
import { create } from "zustand";
import { Bot, Send, Trash2 } from "lucide-react";
import { useDashboardStore } from "@/store/dashboardStore";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// Store propio para que la conversación no se pierda al cambiar de vista
interface ChatStore {
  messages: ChatMessage[];
  add: (m: ChatMessage) => void;
  clear: () => void;
}
const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  add: (m) => set((s) => ({ messages: [...s.messages, m] })),
  clear: () => set({ messages: [] }),
}));

// Convierte **texto** en negrita real (Claude escribe en ese formato)
function renderBold(text: string) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((p, i) =>
    i % 2 === 1 ? <strong key={i} style={{ fontWeight: 700 }}>{p}</strong> : p
  );
}

const SUGGESTIONS = [
  "¿En qué estoy gastando más este mes?",
  "¿Cómo voy con mis metas de ahorro?",
  "Dame ideas para gastar menos",
  "¿Cómo va mi balance comparado con otros meses?",
];

export default function AsistenteView() {
  const activeMonth = useDashboardStore((s) => s.activeMonth);
  const { messages, add, clear } = useChatStore();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, loading]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMsg: ChatMessage = { role: "user", content };
    add(userMsg);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: activeMonth,
          messages: [...messages, userMsg],
        }),
      });
      if (res.status === 401) { window.location.href = "/login"; return; }
      const json = await res.json();
      add({
        role: "assistant",
        content: json.reply ?? "No pude responder, intenta de nuevo.",
      });
    } catch {
      add({
        role: "assistant",
        content: "Error de conexión. Revisa tu internet e intenta de nuevo.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        background: "var(--white)",
        border: "1px solid var(--border)",
        borderRadius: "10px",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: "400px",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "14px 16px",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <Bot size={16} color="#4338CA" />
        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>Asistente IA</span>
        <span
          style={{
            fontSize: "9px",
            background: "#EEF2FF",
            color: "#4338CA",
            padding: "2px 8px",
            borderRadius: "10px",
            fontWeight: 600,
          }}
        >
          Claude
        </span>
        {messages.length > 0 && (
          <button
            onClick={clear}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--muted)",
              fontSize: "11px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontFamily: "var(--font-sans)",
            }}
          >
            <Trash2 size={12} /> limpiar
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", padding: "24px 8px" }}>
            <div style={{ fontSize: "28px", marginBottom: "8px" }}>💬</div>
            <p style={{ fontSize: "13px", color: "var(--text)", fontWeight: 600, marginBottom: "4px" }}>
              Pregúntame sobre tus finanzas
            </p>
            <p style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "16px" }}>
              Conozco tus ingresos, gastos, metas y presupuestos del mes que tengas seleccionado.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxWidth: "340px", margin: "0 auto" }}>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  style={{
                    background: "#F8FAF7",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    padding: "9px 12px",
                    fontSize: "12px",
                    color: "var(--sub)",
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
              marginBottom: "10px",
            }}
          >
            <div
              style={{
                maxWidth: "82%",
                padding: "9px 13px",
                borderRadius: m.role === "user" ? "13px 13px 3px 13px" : "13px 13px 13px 3px",
                background: m.role === "user" ? "#4A7C59" : "#F1F4F0",
                color: m.role === "user" ? "#fff" : "var(--text)",
                fontSize: "12.5px",
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {renderBold(m.content)}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "10px" }}>
            <div
              style={{
                padding: "9px 13px",
                borderRadius: "13px 13px 13px 3px",
                background: "#F1F4F0",
                color: "var(--muted)",
                fontSize: "12.5px",
              }}
            >
              Pensando…
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          padding: "12px",
          borderTop: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          placeholder="Escribe tu pregunta…"
          disabled={loading}
          style={{
            flex: 1,
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "10px 12px",
            fontSize: "13px",
            fontFamily: "var(--font-sans)",
            outline: "none",
            background: "var(--white)",
            color: "var(--text)",
          }}
        />
        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          aria-label="Enviar"
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "8px",
            background: loading || !input.trim() ? "#A8BFA0" : "#4A7C59",
            color: "#fff",
            border: "none",
            cursor: loading || !input.trim() ? "default" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Send size={17} />
        </button>
      </div>
    </div>
  );
}

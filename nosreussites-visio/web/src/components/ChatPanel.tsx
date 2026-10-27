"use client";

import type { useChat } from "@livekit/components-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

type Chat = ReturnType<typeof useChat>;

type Props = {
  open: boolean;
  messages: Chat["chatMessages"];
  send: Chat["send"];
  isSending: boolean;
  onClose: () => void;
};

const timeFormat = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });

export function ChatPanel({ open, messages, send, isSending, onClose }: Props) {
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLOListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages.length, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    await send(text);
    setDraft("");
  }

  return (
    <aside className="chat-panel" aria-label="Discussion" hidden={!open}>
      <header className="chat-header">
        <h2>Discussion</h2>
        <button type="button" className="chat-close" onClick={onClose} aria-label="Fermer la discussion">
          ×
        </button>
      </header>

      <ol className="chat-messages" ref={listRef} aria-live="polite">
        {messages.length === 0 && (
          <li className="chat-empty">
            Les messages sont visibles par toutes les personnes présentes et ne sont pas conservés après
            la réunion.
          </li>
        )}
        {messages.map((m) => (
          <li key={m.id} className={m.from?.isLocal ? "chat-message chat-message-own" : "chat-message"}>
            <div className="chat-meta">
              <strong>{m.from?.isLocal ? "Vous" : m.from?.name || "Participant"}</strong>
              <time dateTime={new Date(m.timestamp).toISOString()}>{timeFormat.format(m.timestamp)}</time>
            </div>
            <p>{m.message}</p>
          </li>
        ))}
      </ol>

      <form className="chat-form" onSubmit={submit}>
        <label htmlFor="chat-input" className="visually-hidden">
          Message
        </label>
        <input
          id="chat-input"
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Écrire un message"
          maxLength={2000}
          autoComplete="off"
        />
        <button type="submit" className="button button-primary" disabled={!draft.trim() || isSending}>
          Envoyer
        </button>
      </form>
    </aside>
  );
}

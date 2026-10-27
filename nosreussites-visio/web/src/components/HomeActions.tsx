"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { generateRoomCode, normalizeRoomCode } from "@/lib/room-code";

export function HomeActions() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function createMeeting() {
    router.push(`/${generateRoomCode()}`);
  }

  function joinMeeting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeRoomCode(code);
    if (!normalized) {
      setError("Ce code n’est pas valide. Il ressemble à abc-defg-hij.");
      return;
    }
    router.push(`/${normalized}`);
  }

  return (
    <div className="home-actions">
      <button type="button" className="button button-primary" onClick={createMeeting}>
        Nouvelle réunion
      </button>

      <form className="join-form" onSubmit={joinMeeting} noValidate>
        <label htmlFor="room-code" className="visually-hidden">
          Code ou lien de la réunion
        </label>
        <input
          id="room-code"
          name="room-code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError(null);
          }}
          placeholder="Saisir un code ou un lien"
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "room-code-error" : undefined}
        />
        <button type="submit" className="button button-secondary" disabled={!code.trim()}>
          Rejoindre
        </button>
      </form>
      {error && (
        <p id="room-code-error" className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

"use client";

import {
  LiveKitRoom,
  PreJoin,
  RoomAudioRenderer,
  StartAudio,
  type LocalUserChoices,
} from "@livekit/components-react";
import { DisconnectReason, MediaDeviceFailure, VideoPresets, type RoomOptions } from "livekit-client";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { Conference } from "./Conference";

type ConnectionDetails = { serverUrl: string; token: string };

type Stage =
  | { kind: "prejoin" }
  | { kind: "connected"; choices: LocalUserChoices; connection: ConnectionDetails }
  | { kind: "left"; message: string };

const DEVICE_ERRORS: Record<MediaDeviceFailure, string> = {
  [MediaDeviceFailure.PermissionDenied]:
    "L’accès à la caméra ou au micro a été refusé. Autorisez-le dans les réglages du navigateur.",
  [MediaDeviceFailure.NotFound]: "Aucune caméra ou aucun micro n’a été détecté.",
  [MediaDeviceFailure.DeviceInUse]: "La caméra ou le micro est déjà utilisé par une autre application.",
  [MediaDeviceFailure.Other]: "La caméra ou le micro ne répond pas.",
};

export function MeetingRoom({ roomCode }: { roomCode: string }) {
  const [stage, setStage] = useState<Stage>({ kind: "prejoin" });
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceNotice, setDeviceNotice] = useState<string | null>(null);

  const choices = stage.kind === "connected" ? stage.choices : null;
  const roomOptions = useMemo<RoomOptions>(
    () => ({
      adaptiveStream: true,
      dynacast: true,
      videoCaptureDefaults: {
        deviceId: choices?.videoDeviceId || undefined,
        resolution: VideoPresets.h720.resolution,
      },
      audioCaptureDefaults: { deviceId: choices?.audioDeviceId || undefined },
      publishDefaults: { simulcast: true },
    }),
    [choices?.videoDeviceId, choices?.audioDeviceId],
  );

  async function join(values: LocalUserChoices) {
    setJoining(true);
    setError(null);
    try {
      const response = await fetch("/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room: roomCode, name: values.username }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error ?? "Impossible de rejoindre la réunion pour le moment.");
      }
      setDeviceNotice(null);
      setStage({ kind: "connected", choices: values, connection: data as ConnectionDetails });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de rejoindre la réunion pour le moment.");
    } finally {
      setJoining(false);
    }
  }

  // Ces gestionnaires doivent rester stables : LiveKitRoom relance sa connexion quand ils changent.
  const handleDisconnected = useCallback((reason?: DisconnectReason) => {
    const message =
      reason === DisconnectReason.CLIENT_INITIATED
        ? "Vous avez quitté la réunion."
        : reason === DisconnectReason.DUPLICATE_IDENTITY
          ? "Vous avez rejoint cette réunion depuis un autre onglet ou un autre appareil."
          : "La connexion à la réunion a été interrompue.";
    setStage({ kind: "left", message });
  }, []);

  const handleError = useCallback((e: Error) => {
    if (e.name === "ConnectionError") {
      setStage({
        kind: "left",
        message: "Impossible de joindre le serveur vidéo. Vérifiez votre connexion internet puis réessayez.",
      });
    } else {
      setDeviceNotice((current) => current ?? DEVICE_ERRORS[MediaDeviceFailure.Other]);
    }
  }, []);

  const handleDeviceFailure = useCallback((failure?: MediaDeviceFailure) => {
    setDeviceNotice(DEVICE_ERRORS[failure ?? MediaDeviceFailure.Other]);
  }, []);

  const dismissNotice = useCallback(() => setDeviceNotice(null), []);

  if (stage.kind === "left") {
    return (
      <main className="centered-message">
        <h1>{stage.message}</h1>
        <div className="centered-actions">
          <button type="button" className="button button-primary" onClick={() => setStage({ kind: "prejoin" })}>
            Rejoindre à nouveau
          </button>
          <Link href="/" className="button button-secondary">
            Retour à l’accueil
          </Link>
        </div>
      </main>
    );
  }

  if (stage.kind === "prejoin") {
    return (
      <main className="prejoin-page" data-lk-theme="default">
        <header className="prejoin-header">
          <Link href="/" className="brand">
            <span className="brand-mark" aria-hidden="true" />
            Nos Réussites <strong>Visio</strong>
          </Link>
        </header>
        <h1 className="prejoin-title">Prêt à rejoindre la réunion ?</h1>
        <p className="prejoin-code">
          Code <code>{roomCode}</code>
        </p>
        <PreJoin
          onSubmit={join}
          onError={(e) => setError(`Caméra ou micro indisponible (${e.message}).`)}
          joinLabel={joining ? "Connexion…" : "Rejoindre"}
          micLabel="Micro"
          camLabel="Caméra"
          userLabel="Votre nom"
        />
        {error && (
          <p className="form-error prejoin-error" role="alert">
            {error}
          </p>
        )}
      </main>
    );
  }

  return (
    <LiveKitRoom
      className="meeting"
      data-lk-theme="default"
      serverUrl={stage.connection.serverUrl}
      token={stage.connection.token}
      connect
      audio={stage.choices.audioEnabled}
      video={stage.choices.videoEnabled}
      options={roomOptions}
      onDisconnected={handleDisconnected}
      onError={handleError}
      onMediaDeviceFailure={handleDeviceFailure}
    >
      <Conference roomCode={roomCode} notice={deviceNotice} onDismissNotice={dismissNotice} />
      <RoomAudioRenderer />
      <StartAudio label="Activer le son" />
    </LiveKitRoom>
  );
}

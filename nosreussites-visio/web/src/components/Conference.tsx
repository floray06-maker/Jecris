"use client";

import {
  CarouselLayout,
  FocusLayout,
  FocusLayoutContainer,
  GridLayout,
  LayoutContextProvider,
  ParticipantTile,
  isTrackReference,
  useChat,
  useConnectionState,
  useCreateLayoutContext,
  useParticipants,
  usePinnedTracks,
  useTracks,
  type TrackReference,
  type TrackReferenceOrPlaceholder,
} from "@livekit/components-react";
import { ConnectionState, RoomEvent, Track } from "livekit-client";
import { useEffect, useRef, useState } from "react";
import { ChatPanel } from "./ChatPanel";
import { Controls } from "./Controls";

function sameTrack(a: TrackReferenceOrPlaceholder, b?: TrackReferenceOrPlaceholder) {
  return !!b && a.participant.identity === b.participant.identity && a.source === b.source;
}

type Props = {
  roomCode: string;
  notice: string | null;
  onDismissNotice: () => void;
};

export function Conference({ roomCode, notice, onDismissNotice }: Props) {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { updateOnlyOn: [RoomEvent.ActiveSpeakersChanged], onlySubscribed: false },
  );
  const participants = useParticipants();
  const connectionState = useConnectionState();
  const layoutContext = useCreateLayoutContext();
  const focusTrack = usePinnedTracks(layoutContext)?.[0];
  const carouselTracks = tracks.filter((track) => !sameTrack(track, focusTrack));

  // Un partage d'écran qui démarre passe automatiquement au premier plan,
  // et la mise en avant est levée quand il s'arrête.
  const screenShares = tracks
    .filter(isTrackReference)
    .filter((track) => track.publication.source === Track.Source.ScreenShare);
  const autoFocused = useRef<TrackReference | null>(null);
  const screenShareKey = screenShares
    .map((t) => `${t.publication.trackSid}_${t.publication.isSubscribed}`)
    .join();
  useEffect(() => {
    const dispatch = layoutContext.pin.dispatch;
    if (!autoFocused.current && screenShares.some((t) => t.publication.isSubscribed)) {
      dispatch?.({ msg: "set_pin", trackReference: screenShares[0] });
      autoFocused.current = screenShares[0];
    } else if (
      autoFocused.current &&
      !screenShares.some((t) => t.publication.trackSid === autoFocused.current?.publication.trackSid)
    ) {
      dispatch?.({ msg: "clear_pin" });
      autoFocused.current = null;
    }
  }, [screenShareKey]);

  // La discussion reste abonnée même panneau fermé, pour compter les messages non lus.
  const { chatMessages, send, isSending } = useChat();
  const [chatOpen, setChatOpen] = useState(false);
  const [seenCount, setSeenCount] = useState(0);
  useEffect(() => {
    if (chatOpen) setSeenCount(chatMessages.length);
  }, [chatOpen, chatMessages.length]);
  const unread = chatOpen ? 0 : chatMessages.length - seenCount;

  const [copied, setCopied] = useState(false);
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copiez le lien de la réunion :", window.location.href);
    }
  }

  return (
    <LayoutContextProvider value={layoutContext}>
      <div className="meeting-layout">
        <header className="meeting-topbar">
          <span className="brand brand-small">
            <span className="brand-mark" aria-hidden="true" />
            <span className="visually-hidden">Nos Réussites Visio, réunion </span>
            <code>{roomCode}</code>
          </span>
          <span className="meeting-topbar-end">
            <span className="meeting-count">
              {participants.length} {participants.length > 1 ? "participants" : "participant"}
            </span>
            <button type="button" className="topbar-button" onClick={copyLink}>
              {copied ? "Lien copié" : "Copier le lien"}
            </button>
          </span>
        </header>

        {connectionState === ConnectionState.Reconnecting && (
          <p className="meeting-banner" role="status">
            Connexion perdue. Reconnexion en cours…
          </p>
        )}
        {notice && (
          <p className="meeting-banner meeting-banner-warning" role="alert">
            {notice}
            <button type="button" className="banner-close" onClick={onDismissNotice} aria-label="Fermer">
              ×
            </button>
          </p>
        )}

        <div className="meeting-body">
          <div className="meeting-stage">
            {focusTrack ? (
              <div className="lk-focus-layout-wrapper">
                <FocusLayoutContainer>
                  <CarouselLayout tracks={carouselTracks}>
                    <ParticipantTile />
                  </CarouselLayout>
                  <FocusLayout trackRef={focusTrack} />
                </FocusLayoutContainer>
              </div>
            ) : (
              <div className="lk-grid-layout-wrapper">
                <GridLayout tracks={tracks}>
                  <ParticipantTile />
                </GridLayout>
              </div>
            )}
          </div>
          <ChatPanel
            open={chatOpen}
            messages={chatMessages}
            send={send}
            isSending={isSending}
            onClose={() => setChatOpen(false)}
          />
        </div>

        <Controls chatOpen={chatOpen} unread={unread} onToggleChat={() => setChatOpen((v) => !v)} />
      </div>
    </LayoutContextProvider>
  );
}

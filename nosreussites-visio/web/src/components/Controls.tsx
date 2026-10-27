"use client";

import { ChatIcon, DisconnectButton, LeaveIcon, MediaDeviceMenu, TrackToggle } from "@livekit/components-react";
import { Track } from "livekit-client";
import { useEffect, useState } from "react";

type Props = {
  chatOpen: boolean;
  unread: number;
  onToggleChat: () => void;
};

export function Controls({ chatOpen, unread, onToggleChat }: Props) {
  const [canShareScreen, setCanShareScreen] = useState(false);

  useEffect(() => {
    setCanShareScreen(typeof navigator.mediaDevices?.getDisplayMedia === "function");
  }, []);

  return (
    <div className="lk-control-bar meeting-controls" role="toolbar" aria-label="Commandes de la réunion">
      <div className="lk-button-group">
        <TrackToggle source={Track.Source.Microphone}>
          <span className="control-label">Micro</span>
        </TrackToggle>
        <div className="lk-button-group-menu">
          <MediaDeviceMenu kind="audioinput" aria-label="Choisir le micro" />
        </div>
      </div>

      <div className="lk-button-group">
        <TrackToggle source={Track.Source.Camera}>
          <span className="control-label">Caméra</span>
        </TrackToggle>
        <div className="lk-button-group-menu">
          <MediaDeviceMenu kind="videoinput" aria-label="Choisir la caméra" />
        </div>
      </div>

      {canShareScreen && (
        <TrackToggle
          source={Track.Source.ScreenShare}
          captureOptions={{ audio: true, selfBrowserSurface: "include" }}
        >
          <span className="control-label">Présenter</span>
        </TrackToggle>
      )}

      <button
        type="button"
        className="lk-button chat-toggle"
        aria-pressed={chatOpen}
        onClick={onToggleChat}
        aria-label={unread > 0 ? `Discussion, ${unread} message(s) non lu(s)` : "Discussion"}
      >
        <ChatIcon />
        <span className="control-label">Discussion</span>
        {unread > 0 && (
          <span className="badge" aria-hidden="true">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <DisconnectButton>
        <LeaveIcon />
        <span className="control-label">Quitter</span>
      </DisconnectButton>
    </div>
  );
}

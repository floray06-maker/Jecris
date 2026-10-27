import { AccessToken } from "livekit-server-sdk";
import { NextResponse } from "next/server";
import { isValidRoomCode } from "@/lib/room-code";

const MAX_NAME_LENGTH = 50;

function error(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * Délivre un jeton d'accès LiveKit pour une réunion.
 * Le navigateur l'utilise pour se connecter directement au serveur vidéo.
 */
export async function POST(request: Request) {
  const { LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL } = process.env;
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
    return error("Le serveur n’est pas configuré (variables LiveKit manquantes).", 500);
  }

  let body: { room?: unknown; name?: unknown };
  try {
    body = await request.json();
  } catch {
    return error("Requête invalide.", 400);
  }

  const room = typeof body.room === "string" ? body.room : "";
  if (!isValidRoomCode(room)) {
    return error("Code de réunion invalide.", 400);
  }

  const name = typeof body.name === "string" ? body.name.trim().slice(0, MAX_NAME_LENGTH) : "";
  if (!name) {
    return error("Indiquez votre nom pour rejoindre la réunion.", 400);
  }

  const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: crypto.randomUUID(),
    name,
    ttl: "1h",
  });
  token.addGrant({
    room,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  return NextResponse.json(
    { serverUrl: LIVEKIT_URL, token: await token.toJwt() },
    { headers: { "Cache-Control": "no-store" } },
  );
}

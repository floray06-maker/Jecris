import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MeetingRoom } from "@/components/MeetingRoom";
import { isValidRoomCode } from "@/lib/room-code";

type Props = { params: Promise<{ room: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { room } = await params;
  return { title: `Réunion ${room} · Nos Réussites Visio` };
}

export default async function RoomPage({ params }: Props) {
  const { room } = await params;
  if (!isValidRoomCode(room)) notFound();
  return <MeetingRoom roomCode={room} />;
}

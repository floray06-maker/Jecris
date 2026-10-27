// Codes de réunion au format abc-defg-hij, à la manière de Google Meet.
// Les lettres l et o sont exclues à la génération pour éviter la confusion avec 1 et 0.
const ALPHABET = "abcdefghijkmnpqrstuvwxyz";

export const ROOM_CODE_PATTERN = /^[a-z]{3}-[a-z]{4}-[a-z]{3}$/;

export function generateRoomCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  const letters = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
  return `${letters.slice(0, 3)}-${letters.slice(3, 7)}-${letters.slice(7)}`;
}

export function isValidRoomCode(code: string): boolean {
  return ROOM_CODE_PATTERN.test(code);
}

/**
 * Accepte un code saisi à la main (majuscules, espaces, tirets oubliés)
 * ou un lien complet collé depuis une invitation.
 */
export function normalizeRoomCode(input: string): string | null {
  let value = input.trim().toLowerCase();
  if (/^https?:\/\//.test(value)) {
    try {
      value = new URL(value).pathname.split("/").filter(Boolean).pop() ?? "";
    } catch {
      return null;
    }
  }
  const letters = value.replace(/[^a-z]/g, "");
  if (letters.length !== 10) return null;
  return `${letters.slice(0, 3)}-${letters.slice(3, 7)}-${letters.slice(7)}`;
}

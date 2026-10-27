#!/usr/bin/env bash
# Génère une paire de clés d'API LiveKit et les écrit dans deploy/.env.
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -f .env ]; then
  cp .env.example .env
fi

if grep -q '^LIVEKIT_API_SECRET=.\+' .env; then
  echo "Des clés existent déjà dans .env ; rien n'a été modifié."
  exit 0
fi

key="API$(openssl rand -hex 8)"
secret="$(openssl rand -base64 48 | tr -d '\n/+=' | cut -c1-48)"

sed -i "s|^LIVEKIT_API_KEY=.*|LIVEKIT_API_KEY=${key}|" .env
sed -i "s|^LIVEKIT_API_SECRET=.*|LIVEKIT_API_SECRET=${secret}|" .env
chmod 600 .env
echo "Clés générées et enregistrées dans deploy/.env"

#!/usr/bin/env bash
# Préparation d'un serveur Ubuntu 24.04 neuf : mises à jour, Docker, pare-feu.
# À lancer une seule fois, en tant que root : sudo ./installer-serveur.sh
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Lancez ce script avec sudo." >&2
  exit 1
fi

echo "1/4 Mise à jour du système"
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get -y upgrade
apt-get install -y ca-certificates curl git ufw unattended-upgrades openssl

echo "2/4 Installation de Docker"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker

echo "3/4 Pare-feu"
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp           # SSH (administration)
ufw allow 80/tcp           # HTTP (obtention des certificats, redirection)
ufw allow 443/tcp          # HTTPS (application et signalisation)
ufw allow 7881/tcp         # WebRTC en TCP (repli)
ufw allow 3478/udp         # TURN
ufw allow 50000:60000/udp  # WebRTC en UDP (audio et vidéo)
ufw --force enable

echo "4/4 Mises à jour de sécurité automatiques"
dpkg-reconfigure -f noninteractive unattended-upgrades

echo "Serveur prêt. Suite : docs/DEPLOIEMENT.md, étape 4."

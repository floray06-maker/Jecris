# Nos Réussites Visio

Application de visioconférence hébergée sur vos propres serveurs, destinée au domaine nosreussites.org. Les participants rejoignent une réunion depuis leur navigateur, avec un lien du type `https://visio.nosreussites.org/abc-defg-hij`, sans créer de compte ni installer de logiciel.

## Ce que fait la première version

- Création d'une réunion en un clic et partage du lien.
- Accès par code ou par lien collé.
- Écran de préparation pour vérifier la caméra et le micro, choisir ses périphériques et indiquer son nom.
- Grille vidéo qui s'adapte au nombre de participants ; un partage d'écran passe automatiquement au premier plan ; un participant peut être épinglé.
- Commandes du micro, de la caméra et du partage d'écran, discussion écrite avec compteur de messages non lus.
- Messages d'erreur en français (caméra refusée, serveur injoignable, reconnexion).
- Interface utilisable sur téléphone.

## Architecture

```
Navigateur --HTTPS------> Caddy --> web (Next.js, port 3000)   pages et jetons d'accès
Navigateur --WSS--------> Caddy --> LiveKit (port 7880)         signalisation
Navigateur --UDP / TCP----------> LiveKit (50000-60000, 7881, 3478)   audio et vidéo
```

- **web/** contient l'application Next.js (React, TypeScript). Elle sert les pages et signe, par la route `/api/token`, les jetons qui autorisent un navigateur à entrer dans une réunion.
- **LiveKit** est le serveur média. Chaque participant lui envoie son flux une seule fois et le serveur le redistribue aux autres, en adaptant la qualité à la connexion et à la taille d'affichage de chacun. Ce modèle (SFU) est celui de Zoom, Google Meet et Jitsi. LiveKit est un logiciel libre (licence Apache 2.0) ; il fournit aussi des bibliothèques pour de futures applications mobiles et un module d'enregistrement.
- **Caddy** reçoit le trafic HTTPS et obtient seul les certificats Let's Encrypt.

Les trois services tournent dans Docker sur un seul serveur (voir `deploy/`).

## Développer sur son ordinateur

Prérequis : Node.js 22 ou plus récent, Docker.

Démarrer le serveur vidéo en mode développement :

```bash
docker compose -f docker-compose.dev.yml up
```

Dans un second terminal, démarrer l'application :

```bash
cd web && cp .env.example .env.local && npm install && npm run dev
```

L'application répond sur http://localhost:3000.

## Arborescence

```
web/                     application Next.js
  src/app/               pages (accueil, réunion) et route /api/token
  src/components/        salle de réunion, commandes, discussion
  src/lib/room-code.ts   génération et validation des codes de réunion
  Dockerfile             image de production
deploy/                  mise en production sur un serveur
  docker-compose.yml     Caddy, LiveKit et l'application
  Caddyfile              HTTPS et redirection vers les services
  livekit.yaml           réglages du serveur vidéo
  installer-serveur.sh   préparation d'un serveur Ubuntu neuf
  generer-cles.sh        création des clés d'API LiveKit
docs/                    documentation
docker-compose.dev.yml   serveur vidéo pour le développement local
```

## Documentation

- [Ce qu'il faut acheter et préparer](docs/INFRASTRUCTURE.md)
- [Mise en ligne pas à pas](docs/DEPLOIEMENT.md)
- [Plan de développement](docs/PLAN-DE-DEVELOPPEMENT.md)

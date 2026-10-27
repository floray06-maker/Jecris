# Plan de développement

## Étape 1. Première version (réalisée)

Réunions par lien, écran de préparation, grille vidéo, partage d'écran, discussion écrite, interface en français adaptée au téléphone, configuration de production (Docker, Caddy, LiveKit) et documentation d'installation.

## Étape 2. Mise en ligne et fiabilité

- Déploiement sur le serveur et essai réel à plusieurs, depuis des réseaux différents.
- Relais TURN chiffré sur le port 443, pour les réseaux d'établissements scolaires et d'entreprises qui bloquent tout le reste. Il passe par un module de Caddy qui aiguille le trafic du port 443 selon le nom demandé.
- Test de charge avec l'outil `lk load-test` de LiveKit, pour connaître le nombre de participants que le serveur tient réellement.
- Surveillance : alerte en cas d'indisponibilité, suivi de l'occupation du processeur et du réseau.
- Pages de mentions légales et de confidentialité.

## Étape 3. Comptes et rôles

Aujourd'hui, toute personne qui ouvre le site peut créer une réunion, donc utiliser votre serveur. Cette étape réserve la création aux organisateurs.

- Comptes organisateurs, avec connexion par lien envoyé par courriel ; les invités continuent d'entrer sans compte.
- Base de données PostgreSQL pour les comptes et les réunions programmées.
- Pouvoirs de l'organisateur : couper le micro d'un participant, l'exclure, verrouiller la réunion, salle d'attente avec admission manuelle.
- Réunions programmées avec lien permanent et invitation à ajouter à un agenda.

## Étape 4. Fonctions de confort

- Main levée et réactions.
- Flou d'arrière-plan et fond virtuel.
- Sous-titres et transcription automatiques.
- Tableau blanc partagé.
- Enregistrement des réunions (module Egress de LiveKit et stockage des fichiers), avec consentement affiché.
- Sous-groupes de travail, sur le modèle des « breakout rooms » de Zoom.

## Étape 5. Applications mobiles

D'abord une application web installable sur l'écran d'accueil du téléphone (PWA), puis, si le besoin se confirme, des applications Android et iOS construites avec les bibliothèques mobiles de LiveKit et publiées sur les magasins d'applications (comptes développeur Google Play et Apple à prévoir).

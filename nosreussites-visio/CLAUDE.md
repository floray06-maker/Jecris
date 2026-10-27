# Contexte du projet pour Claude

Application de visioconférence hébergée par le porteur du projet, pour le domaine nosreussites.org. Présentation et architecture dans `README.md`, achats dans `docs/INFRASTRUCTURE.md`, installation dans `docs/DEPLOIEMENT.md`, étapes suivantes dans `docs/PLAN-DE-DEVELOPPEMENT.md`.

## État au 27 octobre 2026

- Première version de l'application écrite (Next.js et LiveKit). Testée dans un navigateur automatisé : accueil, écran de préparation, route `/api/token`, messages d'erreur, interface de réunion avec participants simulés.
- Aucun appel audio et vidéo réel n'a encore été testé entre deux personnes.
- La configuration de production (`deploy/`) n'a jamais été lancée ; seule sa syntaxe a été vérifiée.

## Décisions prises

- Le projet est conservé dans le dépôt public `floray06-maker/jecris`, dossier `nosreussites-visio/`, sur la branche `main`. Aucun secret ne doit y entrer.
- Serveur média LiveKit autohébergé, interface propre au projet.
- Le domaine nosreussites.org porte déjà un site, qui reste chez son hébergeur actuel. L'application répond sur `visio.nosreussites.org`, servie par un VPS séparé ; `rtc` et `turn` pointent vers le même VPS.

## En attente du porteur du projet

- Le prestataire chez qui le domaine a été acheté, et la manière dont le site actuel est construit et hébergé.
- L'achat du VPS.

## Conventions

- Interface et documentation en français.
- La skill `charte-ecriture-imu` règle la forme de toute prose produite pour ce projet.

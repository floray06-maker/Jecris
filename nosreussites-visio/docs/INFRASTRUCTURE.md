# Ce qu'il faut acheter et préparer

Ce document recense tout ce qui doit exister avant la mise en ligne. La procédure d'installation elle-même se trouve dans [DEPLOIEMENT.md](DEPLOIEMENT.md).

## 1. Le domaine et le site existant

Le domaine nosreussites.org porte déjà un site. Ce site reste où il est, sans modification : l'application de visioconférence s'installe sur un serveur à part et répond à une sous-adresse, `visio.nosreussites.org`. Les deux coexistent grâce aux enregistrements DNS du domaine, qui désignent pour chaque adresse le serveur qui répond.

```
nosreussites.org          ->  hébergement actuel (inchangé)
www.nosreussites.org      ->  hébergement actuel (inchangé)
visio.nosreussites.org    ->  nouveau serveur (application)
rtc.nosreussites.org      ->  nouveau serveur (vidéo)
turn.nosreussites.org     ->  nouveau serveur (relais, étape 2)
```

L'application ne se dépose pas par FTP dans l'espace de l'hébergement actuel. Un hébergement de site classique sert des pages à la demande ; la visioconférence a besoin de programmes qui tournent en permanence (serveur vidéo, application Node.js) et de ports réseau ouverts, ce que seuls un VPS ou un serveur dédié permettent.

Une fois l'application en ligne, il reste à placer sur le site existant un bouton ou un lien « Visioconférence » vers `https://visio.nosreussites.org`.

Si le site actuel tourne lui-même sur un VPS, l'application peut en principe s'y installer aussi. Les ports 80 et 443 y sont alors déjà occupés par le serveur web du site, et la configuration de `deploy/` doit être adaptée. Un serveur séparé reste plus simple et évite qu'une réunion chargée ralentisse le site.

### Situation de nosreussites.org

Le domaine a été acheté chez LWS et le site est installé sur un hébergement web mutualisé LWS (offre standard). Cet hébergement ne peut pas faire tourner la visioconférence ; le site y reste, et seuls trois enregistrements DNS sont à ajouter dans l'espace client LWS (section 3).

## 2. Le serveur

### Quel type de serveur

Il faut un **serveur privé virtuel (VPS)** ou un serveur dédié, avec un accès administrateur complet. Un **hébergement web mutualisé** ne convient pas : il sert des sites PHP et ne permet ni de lancer Docker ni d'ouvrir les ports UDP dont la vidéo a besoin. Chez les hébergeurs, l'offre à choisir porte le nom de « VPS », « Instance » ou « Cloud Server ».

### Configuration de départ

| Élément | Minimum conseillé |
|---|---|
| Processeur | 4 vCPU |
| Mémoire | 8 Go |
| Disque | 80 Go SSD |
| Adresse IP | IPv4 publique fixe |
| Réseau | 1 Gbit/s, trafic illimité ou au moins 20 To par mois |
| Système | Ubuntu 24.04 LTS |
| Localisation | France ou Union européenne |

Cette configuration permet de démarrer et de tenir plusieurs réunions simultanées de taille moyenne. La capacité réelle se mesurera par un test de charge (étape 2 du [plan de développement](PLAN-DE-DEVELOPPEMENT.md)) ; le serveur pourra ensuite être agrandi sans réinstallation chez la plupart des hébergeurs.

### Pourquoi le trafic compte plus que la puissance

La vidéo consomme surtout de la bande passante. Estimation pour une classe de 25 personnes, caméras allumées : chacun envoie environ 2 Mbit/s au serveur, qui renvoie à chacun les vignettes des autres en qualité réduite. Le serveur émet alors de l'ordre de 100 à 200 Mbit/s, soit 45 à 90 Go par heure de réunion. Deux heures par jour pendant un mois représentent plusieurs téraoctets. Une offre au trafic plafonné bas ou facturé au gigaoctet deviendrait vite coûteuse.

### Où l'acheter

Hébergeurs à comparer, tous en Europe : LWS (France), OVHcloud (France), Scaleway (France), Hetzner (Allemagne). Prendre le VPS chez LWS garde le domaine, le site et le serveur dans le même espace client.

Chez LWS, le trafic des VPS est annoncé illimité mais le débit est plafonné selon l'offre. D'après les pages de LWS consultées le 28 octobre 2026, ce plafond va de 100 Mbit/s en entrée de gamme à 500 Mbit/s, voire 1 Gbit/s, sur les offres supérieures. Un débit de 100 Mbit/s suffit pour des réunions de quelques personnes, pas pour une classe entière caméras allumées (voir l'estimation ci-dessus). Vérifiez le débit indiqué sur la fiche de l'offre avant de commander, pas seulement la mention « trafic illimité ».

 Vérifiez sur l'offre choisie le volume de trafic inclus, la possibilité d'ouvrir des ports UDP et la disponibilité d'Ubuntu 24.04. Pour la configuration ci-dessus, le prix se situe entre une dizaine et quelques dizaines d'euros par mois selon l'hébergeur ; il est à vérifier au moment de la commande.

## 3. Les enregistrements DNS

Les enregistrements se créent dans la zone DNS de nosreussites.org, chez le bureau d'enregistrement où le domaine a été acheté (OVHcloud, Gandi, Hostinger, IONOS…) ou chez le service qui gère sa zone, Cloudflare par exemple. L'hébergeur actuel du site est souvent le même prestataire. Ajoutez trois enregistrements qui pointent vers l'adresse IPv4 du nouveau serveur.

| Nom | Type | Valeur | Usage |
|---|---|---|---|
| `visio.nosreussites.org` | A | adresse IP du serveur | application |
| `rtc.nosreussites.org` | A | adresse IP du serveur | serveur vidéo |
| `turn.nosreussites.org` | A | adresse IP du serveur | relais pour réseaux filtrés (étape 2) |

Dans la plupart des interfaces, le champ « Nom » ne demande que la partie avant le domaine (`visio`, `rtc`, `turn`).

Ne modifiez pas les enregistrements existants, en particulier ceux du domaine nu (`@`), de `www` et les enregistrements `MX` : ils font fonctionner le site actuel et la messagerie. Si la zone est gérée par Cloudflare, désactivez le proxy (nuage gris, « DNS only ») sur les trois nouveaux enregistrements.

### Chez LWS

1. Se connecter à l'espace client LWS Panel.
2. Ouvrir la gestion du domaine nosreussites.org, puis la rubrique de la zone DNS (intitulée « Gestion de la zone DNS » dans la documentation de LWS).
3. Avant toute modification, noter ou capturer les enregistrements existants, comme le recommande LWS.
4. Ajouter les trois enregistrements de type A du tableau ci-dessus, avec dans le champ du nom `visio`, `rtc` puis `turn`, et comme valeur l'adresse IPv4 du VPS.

Ces modifications ne prennent effet que si le domaine utilise les serveurs DNS de LWS, ce qui est le réglage par défaut d'un domaine acheté et hébergé chez LWS. Les intitulés exacts de l'interface peuvent différer légèrement de ceux-ci.

## 4. Les ports à ouvrir

Le script `deploy/installer-serveur.sh` ouvre ces ports dans le pare-feu du serveur. Si l'hébergeur propose en plus un pare-feu dans son interface, ouvrez-y les mêmes.

| Port | Protocole | Usage |
|---|---|---|
| 22 | TCP | connexion SSH pour l'administration |
| 80 | TCP | obtention des certificats HTTPS |
| 443 | TCP | application et signalisation |
| 7881 | TCP | audio et vidéo quand l'UDP est bloqué |
| 3478 | UDP | relais TURN |
| 50000 à 60000 | UDP | audio et vidéo |

## 5. Comptes et accès

- **Le dépôt GitHub** `floray06-maker/jecris`, qui contient le projet dans son dossier `nosreussites-visio`. Ce dépôt est public : le fichier `deploy/.env`, qui contient les clés secrètes, ne doit jamais y être ajouté (le fichier `.gitignore` du projet l'exclut déjà).
- **Une adresse électronique** pour Let's Encrypt, qui y envoie les avis d'expiration de certificat.
- **Une clé SSH** pour se connecter au serveur sans mot de passe (la plupart des hébergeurs la demandent à la commande).

## 6. Données personnelles

Le service fait circuler l'image et la voix des participants, parfois de mineurs. Avant l'ouverture au public, prévoyez :

- une page de mentions légales et une politique de confidentialité ;
- l'inscription du traitement au registre de votre structure, si elle en tient un ;
- le contrat de sous-traitance (DPA) que fournit l'hébergeur ;
- le consentement des participants avant tout enregistrement (fonction prévue à l'étape 4).

En l'état, rien n'est enregistré : la vidéo et les messages de la discussion transitent par le serveur sans être stockés.

## Liste de contrôle

- [ ] Accès à l'espace client LWS (zone DNS de nosreussites.org)
- [ ] VPS commandé (Ubuntu 24.04, adresse IP notée)
- [ ] Trois enregistrements DNS créés
- [ ] Adresse électronique choisie pour les certificats

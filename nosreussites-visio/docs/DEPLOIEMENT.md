# Mise en ligne pas à pas

Prérequis : avoir réuni les éléments de [INFRASTRUCTURE.md](INFRASTRUCTURE.md). Les commandes se tapent dans un terminal connecté au serveur.

## 1. Se connecter au serveur

```bash
ssh root@ADRESSE_IP_DU_SERVEUR
```

Certains hébergeurs créent un utilisateur `ubuntu` à la place de `root` ; les commandes s'écrivent alors précédées de `sudo`.

## 2. Vérifier les enregistrements DNS

```bash
getent hosts visio.nosreussites.org rtc.nosreussites.org
```

Les deux noms doivent renvoyer l'adresse IP du serveur. Juste après leur création, la propagation peut demander de quelques minutes à quelques heures.

## 3. Récupérer le code et préparer le serveur

```bash
apt-get update && apt-get install -y git
```

```bash
git clone https://github.com/floray06-maker/jecris.git /opt/jecris
```

Le projet se trouve dans le dossier `nosreussites-visio` du dépôt `jecris`. Ce dépôt est public ; sa récupération ne demande aucune identification.

```bash
cd /opt/jecris/nosreussites-visio && sudo ./deploy/installer-serveur.sh
```

Le script met le système à jour, installe Docker, configure le pare-feu et active les mises à jour de sécurité automatiques. Si votre connexion SSH utilise un autre port que 22, ouvrez-le avant de lancer le script (`ufw allow NUMERO/tcp`), sinon le pare-feu vous coupera l'accès.

## 4. Configurer

```bash
cd /opt/jecris/nosreussites-visio/deploy && ./generer-cles.sh
```

Le script crée le fichier `deploy/.env` et y inscrit des clés d'API neuves. Ouvrez ensuite ce fichier pour renseigner l'adresse électronique :

```bash
nano .env
```

Vérifiez `APP_DOMAIN` et `LIVEKIT_DOMAIN`, complétez `ACME_EMAIL`, enregistrez (Ctrl+O, Entrée) et quittez (Ctrl+X). Le fichier `.env` contient des secrets : il ne doit jamais être publié ni ajouté au dépôt.

## 5. Lancer

```bash
docker compose up -d --build
```

La première construction de l'image prend quelques minutes. Pour suivre l'obtention des certificats :

```bash
docker compose logs -f caddy
```

(Ctrl+C pour quitter l'affichage, les services continuent de tourner.)

## 6. Vérifier

1. Ouvrir https://visio.nosreussites.org et créer une réunion.
2. Rejoindre la même réunion depuis un second appareil, de préférence un téléphone en 4G ou 5G (réseau différent de celui du premier).
3. Vérifier que chacun voit et entend l'autre, puis tester le partage d'écran et la discussion.

## Mettre à jour après une modification du code

```bash
cd /opt/jecris && git pull && cd nosreussites-visio/deploy && docker compose up -d --build
```

## Dépannage

| Symptôme | Cause probable | Vérification |
|---|---|---|
| Le site ne s'ouvre pas ou le certificat est refusé | DNS pas encore propagé, ou port 80 ou 443 fermé | `docker compose logs caddy` |
| « Impossible de joindre le serveur vidéo » | `rtc.nosreussites.org` ne pointe pas vers le serveur, ou LiveKit est arrêté | `docker compose logs livekit` |
| Les participants sont connectés mais ne se voient pas | Ports UDP 50000 à 60000 ou TCP 7881 fermés, souvent dans le pare-feu de l'hébergeur | `ufw status` et interface de l'hébergeur |
| Échec uniquement depuis un établissement ou une entreprise | Réseau qui ne laisse passer que le port 443 | Relais TURN chiffré, prévu à l'étape 2 |

État des services :

```bash
docker compose ps
```

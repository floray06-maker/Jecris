# Fabriquer l'APK — « J'écris en français »

Projet Android Studio prêt à compiler. L'application web entière est embarquée dans `app/src/main/assets/app/` : **l'APK produit ne fait aucun accès réseau, jamais**, et fonctionne sur une tablette qui n'a jamais vu le Wi-Fi.

---

## Avant de vous lancer : en avez-vous vraiment besoin ?

Sur Android, « Ajouter à l'écran d'accueil » depuis Chrome ne crée pas un raccourci : le système fabrique un **WebAPK**, une vraie application installée, avec son icône dans le tiroir, son nom, son plein écran et son fonctionnement hors ligne. Pour l'usage en classe, c'est équivalent à ce projet, et cela prend deux minutes au lieu d'une soirée.

L'APK compilé ci-dessous a trois avantages, et trois seulement :

1. Il s'installe sur une tablette **sans aucune connexion**, par simple copie du fichier.
2. Il se distribue par **gestion de flotte** (MDM) comme n'importe quelle application.
3. Il ne dépend d'aucune adresse web : rien à héberger, rien qui puisse tomber.

Si aucun de ces trois points ne vous concerne, installez la version web et gardez votre soirée.

---

## Ce qu'il faut

- **Android Studio** (gratuit, `developer.android.com/studio`), environ 1 Go à télécharger.
- Rien d'autre : Android Studio installe lui-même le JDK, le SDK et Gradle.

## Les étapes

1. Décompresser `jecris-apk-android.zip`.
2. Android Studio → **Open** → choisir le dossier décompressé (celui qui contient `settings.gradle.kts`).
3. Laisser la première synchronisation Gradle se terminer. Elle télécharge les dépendances : c'est le seul moment où une connexion est nécessaire. Si Android Studio propose une mise à jour du plugin Android Gradle, **accepter**.
4. **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
5. À la fin, une notification « locate » mène au fichier :
   `app/build/outputs/apk/debug/app-debug.apk`

C'est cet APK que vous copiez sur la tablette.

## Installer sur la tablette

1. Transférer `app-debug.apk` : câble USB, clé USB-C, ou envoi à soi-même.
2. L'ouvrir depuis le gestionnaire de fichiers de la tablette.
3. Android demandera d'autoriser l'installation depuis cette source : *Paramètres → Installer des applications inconnues → autoriser pour le gestionnaire de fichiers*. C'est normal pour une application qui ne vient pas du Play Store.
4. Installer. L'icône apparaît dans le tiroir d'applications.

## Pour une distribution large

L'APK de débogage suffit pour quinze tablettes posées sur une table. Pour passer par un MDM ou le Play Store, il faut un APK **signé** :
**Build → Generate Signed Bundle / APK → APK**, créer une clé (`keystore`) et **la conserver précieusement** : sans elle, aucune mise à jour ultérieure de l'application ne sera acceptée par les tablettes déjà équipées.

---

## Ce que fait le code, en trois points

**Le stockage fonctionne.** C'est le seul point technique délicat et il est réglé. Une WebView qui charge un fichier en `file://` se voit refuser IndexedDB par Android : la progression des élèves serait perdue à chaque fermeture. `MainActivity` utilise `WebViewAssetLoader`, qui sert les fichiers embarqués sous une origine `https://appassets.androidplatform.net/` — origine locale, réservée par Android à cet usage, qui ne sort pas de l'appareil. Le stockage local redevient pleinement disponible.

**Aucune permission n'est demandée.** Regardez `AndroidManifest.xml` : il n'y a pas une seule ligne `<uses-permission>`. L'application ne peut ni accéder au réseau, ni lire les fichiers, ni utiliser le micro. C'est vérifiable par n'importe qui, et c'est l'argument à donner si on vous interroge sur les données des élèves.

**Deux pressions pour quitter.** Le bouton retour affiche « Appuie encore pour quitter ». En classe, une sortie accidentelle en plein exercice coûte plus qu'elle ne paraît.

---

## Modifier le contenu ensuite

Le contenu pédagogique est le fichier `app/src/main/assets/app/parcours.json`. Pour le faire évoluer : le remplacer, incrémenter `versionCode` et `versionName` dans `app/build.gradle.kts`, recompiler, réinstaller.

C'est là le vrai coût de l'APK : la version web, elle, se met à jour en remplaçant un fichier sur le serveur, et les tablettes suivent toutes seules. Si vous prévoyez de retoucher souvent les exercices, l'APK vous coûtera plus qu'il ne vous rapporte.

## Livrer l'autre application

Le même projet sert pour l'application d'écriture manuscrite : remplacer le contenu de `assets/app/` par ses fichiers, et dans `MainActivity.kt` la constante `DEPART` par `jecris-en-francais.html`. Changer aussi `applicationId` (par exemple `fr.lyceevictorlaloux.jecris.ecriture`) et `app_name`, faute de quoi la seconde installation écraserait la première.

---

*Lycée Victor Laloux, Tours (37000).*

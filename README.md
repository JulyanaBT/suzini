# Suzini — BT250 Double Mixte

Site statique publié par GitHub Pages depuis `main`, à la racine du dépôt.

## Tirage de 8 équipes

- Organisateur : `admin/tirage.html`, accessible depuis le tableau de bord.
- Public : `tirage.html`, accessible depuis le menu principal.
- Source : `events/suzini-bt250-mixte-2026-10-02/teams` dans Firestore.
- État partagé : `events/suzini-bt250-mixte-2026-10-02/config/draw`.

Le démarrage exige exactement huit équipes visibles, selon les mêmes exclusions
que la page Équipes (suppression, annulation, refus, liste d’attente).
Les deux poids les plus faibles sont proposés comme têtes de série. L’organisateur
peut corriger ces choix, notamment en cas d’égalité ou de rang manquant.
TS2 occupe la ligne 1 ; TS1 occupe la ligne 8. Chaque clic tire sans remise
l’équipe suivante et remplit les lignes 2 à 7 dans cet ordre.

Chaque étape est enregistrée par transaction et affichée en direct au public.
Une révision empêche deux appareils de modifier simultanément le même état.
Les données des équipes sont figées au démarrage ; une modification de la liste
bloque la suite du tirage jusqu’à correction ou remise à zéro explicite.
La remise à zéro affecte immédiatement le tableau public et demande confirmation.
Aucun tirage n’est déclenché au simple chargement d’une page.

Le document contient `{ revision, draw, updatedAt }`. `draw` est nul avant le
démarrage ou après remise à zéro ; sinon il contient `version`, `eventId`,
`teams`, `seed1`, `seed2`, `slots` et `matches` (QF1 à QF4).
Les lignes sont indexées de 0 à 7 dans `slots` et les matchs utilisent les IDs
d’équipes, afin de préparer le raccordement à la programmation.
Les paiements et autres champs privés ne sont pas recopiés dans ce document.
Les matchs de classement TMC, les scores et les horaires restent à réaliser.
La capacité de 12 des pages d’inscription existantes n’a pas été changée.

## Autorisations

La page reprend la session organisateur existante dans `admin-session.js`.
Cette session est uniquement côté navigateur : elle ne constitue pas une
authentification serveur. Les règles Firestore, absentes du dépôt, doivent
contrôler les écritures. Aucune règle n’est modifiée par cette évolution.
Ne pas considérer les boutons masqués ou le mot de passe JavaScript comme
une protection de la base. Une vraie sécurisation nécessite Firebase Auth
et des règles fondées sur l’identité de l’organisateur.

Le public doit pouvoir lire le document du tirage et l’organisateur doit pouvoir
le lire et l’écrire, ainsi que lire les équipes. En cas de refus, la page affiche
une erreur sans annoncer un enregistrement réussi. Les écritures de production
n’ont pas été testées pour ne pas effectuer le vrai tirage.

## Vérification

Avec Node.js 20 ou supérieur :

```sh
node tests/draw-core.test.mjs
```

Les tests couvrent 500 tirages complets, l’ordre des lignes, les têtes de série,
l’absence de doublons et le raccordement des quarts.
La prévisualisation locale avec données fictives a également permis de vérifier
le parcours des six clics, la reprise après rechargement, la vue publique sans
commandes, l’affichage à 390 px, les têtes de série identiques, les erreurs
Firestore et conflits de révision, et le blocage avec sept équipes.

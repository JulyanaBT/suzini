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
Les matchs de classement et horaires figurent désormais dans la programmation ; la saisie des scores est disponible en administration.
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
node --experimental-vm-modules tests/draw-page.test.mjs
```

Les tests couvrent 500 tirages complets, l’ordre des lignes, les têtes de série,
l’absence de doublons et le raccordement des quarts.
Le test de page exécute les vrais gestionnaires de clics sur 20 tirages complets,
avec réponses Firestore simulées qui réordonnent les champs après chaque écriture,
rechargement après chaque ligne, double clic, refus d'écriture et conflit.
Les URL des scripts du tirage sont versionnées pour éviter de réutiliser une
ancienne comparaison des équipes conservée dans le cache du navigateur.
La prévisualisation locale avec données fictives a également permis de vérifier
le parcours des six clics, la reprise après rechargement, la vue publique sans
commandes, l’affichage à 390 px, les têtes de série identiques, les erreurs
Firestore et conflits de révision, et le blocage avec sept équipes.

## Programmation

`programmation.html` propose deux onglets : Tableau (arbre du tournoi) et
Chronologique (créneaux, puis terrains). Le choix est conservé dans le fragment
`#tableau` ou `#chronologique`. La page admin propose les mêmes vues avec la
navigation organisateur.

Les 12 matchs sont calculés par `assets/js/schedule-core.mjs` : quatre quarts,
deux demies, deux rencontres de classement 5–8, puis les matchs des places
1–2, 3–4, 5–6 et 7–8. Chaque équipe joue trois fois.

| Début | Lisa de Los Pimentos | Manon Queen Bee |
| --- | --- | --- |
| 18 h 00 | QF1 | QF2 |
| 18 h 45 | QF3 | QF4 |
| 19 h 30 | CL1 | CL2 |
| 20 h 15 | DF1 | DF2 |
| 21 h 00 | 7e place | 5e place |
| 21 h 45 | 3e place | — |
| 22 h 30 | Finale | — |

Chaque créneau dure 45 minutes ; fin prévue à 23 h 15. La page écoute le document
du tirage en lecture seule, accepte un tirage partiel et complète les quarts à
chaque équipe placée. Les horaires et terrains sont modifiables depuis la vue chronologique admin. Les tours suivants
mentionnent le vainqueur ou perdant attendu puis les équipes qualifiées après confirmation du résultat.

```sh
node tests/schedule-core.test.mjs
```

Le test simule les 4096 combinaisons de résultats pour vérifier les dépendances,
l’absence de chevauchement pour une équipe ou un terrain, trois matchs par
équipe et huit places finales distinctes. Les deux vues ont été vérifiées dans
le navigateur à 390 px et 1280 px, ainsi que leur mise à jour pendant un tirage
fictif, le rechargement et la navigation au clavier.

La vue chronologique conserve deux colonnes dès 320 px. Lisa est en rouge (🌶️),
Manon en jaune (🐝). Le match de 3e place précède la finale sur deux créneaux
distincts. Le sous-menu est affiché directement sous la navigation principale.

Les cartes de programmation affichent uniquement les noms d’équipes. Leur
libellé compact (« Quart 1 », « Demi 1 », etc.) remplace le code et le titre
répétés. Sur mobile, deux tours entiers du tableau sont visibles sans défilement ;
le troisième reste accessible horizontalement. Vérifié à 320 px et 390 px.

### Résultats en administration

La programmation admin propose Chronologique et Résultats. Chaque équipe dispose
de boutons +/− pour le set en cours. « Valider le set » enregistre un set sans
égalité puis ouvre le suivant (super tie-break au troisième). Après deux sets
gagnés, une fenêtre récapitule le vainqueur et les scores ; seule la confirmation
valide le match et propage les équipes dans les tours suivants.

Chaque modification est enregistrée par transaction dans
`events/suzini-bt250-mixte-2026-10-02/config/results`, liée à la révision du tirage.
Les sets sont stockés sous forme de maps `{a,b}` compatibles Firestore. La saisie
reprend après rechargement. Les modifications concurrentes du même match sont
refusées avec un message explicite. Un résultat peut être corrigé tant qu’aucun
match dépendant n’a commencé sa saisie. Les règles Firestore doivent autoriser
la lecture et les écritures organisateur sur ce document, comme pour le tirage.

Validation : `node tests/scoring-core.test.mjs`, parcours navigateur fictif
avec +/−, trois sets, annulation du récapitulatif, rechargement, confirmation
et propagation du vainqueur. Aucun résultat réel n’a été saisi pendant les tests.

### Échanges de créneaux et terrains

Dans la vue chronologique admin, les flèches ↑/↓ échangent le match avec celui
du créneau précédent/suivant sur le même terrain. La flèche horizontale échange
les terrains pour le même horaire. Une destination vide reçoit simplement le
match. Les créneaux durent 45 minutes, de 18 h à 23 h 15 (fin à minuit).
Les déplacements qui placeraient un match avant la fin d’un de ses matchs
précédents sont désactivés.

Les positions sont enregistrées par transaction dans
`events/suzini-bt250-mixte-2026-10-02/config/programming`. Elles sont indépendantes
du tirage et des scores et partagées par le tableau public, la chronologie et
la saisie des résultats. Un document absent conserve le programme initial.
La lecture et les écritures organisateur de ce document doivent être permises
par les règles Firestore. Les conflits entre appareils sont détectés avant écriture.

Tests : `node tests/planning-core.test.mjs` (échanges, cases libres, dépendances,
limites et 1000 déplacements). Vérification mobile avec équipes fictives :
échange de terrain puis de créneau, rechargement, affichage public et résultats,
refus d’écriture sans changement. Aucun créneau réel modifié pendant les tests.

### Remise à zéro et accès public

« Réinitialiser le match » efface, après confirmation, ses sets, son score en
cours et son résultat validé. Les qualifications issues de ce match sont
retirées du tableau et de la chronologie publics et admin. Si un match dépendant
a déjà une saisie, il faut le réinitialiser en premier ; les autres résultats
ne sont jamais supprimés implicitement.

Les liens Matchs et retour au public portent une version, ainsi que les modules
de navigation et de programmation, pour éviter une ancienne page en cache.
Vérification du tableau public réel en lecture seule : vainqueur de QF1 en DF1
et perdant de QF1 en CL1. Tests supplémentaires avec données fictives :
confirmation, propagation et réinitialisation avec une page publique déjà ouverte.

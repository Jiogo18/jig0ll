# Jig0ll

Un bot à tout faire pour Discord

Utilise les interactions Discord (slash commands)

---

## Ajouter @Jig0ll sur votre serveur

Jig0ll n'est pas un bot public

---

## Liste des Commandes

### Préfixes

- `/[commande]` : Préfixe d'interaction, si aucune commande ne s'affiche c'est qu'il y a une faute ou que les interactions ne sont pas autorisées
- `![commande]` : Préfixe des messages (non configurable)
- `@Jig0ll [commande]` Préfixe des messages

### Help

- `help` : affiche la liste des commandes
- `help [commande]` : détaille une commande

### Ping

- `ping` : retourne `pong` et le temps de réponse du bot

### Info

- `info [type] (cible)` : Retourne des informations de la cible

- Type
  - `info snowflake <cible>` : Informations du snowflake (id) tel que la date de création
    (Snowflake => <https://discord.js.org/#/docs/main/stable/typedef/Snowflake>)
  - `info user (cible)` : Informations de l'utilisateur (ou de vous)
  - `info channel (cible)` : Informations du channel (ou channel actuel)
  - `info role <cible>` : Informations du role
  - `info guild` : Informations du serveur

- Cible
  - un Channel ou un Client (`info id @Jig0ll`)
  - Accepte les snowflake (exemple: `386086366116708363`)
  - Si vide : l'auteur de la commande

### Météo

- `météo <ville/pays>` : La météo actuelle de la ville

### Plénitude

- `plénitude [commande]` : Commandes spécifiques de Plénitude
  - `plénitude météo` : La météo à Plénitude
  - `plénitude info` : Informations sur Plénitude
  - `plénitude invite_score` : Score actuel du concours d'invitations
  - `plénitude invite_end` : Terminer le concours d'invitations et afficher le gagnant
  - `plenitude_config set PlenCity <ville>` : Change la position de Plénitude
  - `plenitude_config get PlenCity` : Donne la position de Plénitude

### Calculs

- `calc <ligne de calcul>` : Calculs (nom alternatif : 'r')
  - Lancer de dés : `2d6` retourne la somme de 2 dès cubiques

### Mange

- `mange <qui mange> <mange quoi>` : Command inrp pour quelques serveurs

### Inventaire

- `inventaire [commande]` : Gestion d'inventaire (nom alternatif : 'inv')
  - `inventaire couleur <inventaire> <couleur>` : Changer la couleur de l'inventaire au format HEX
  - `inventaire create <nom>` : Créer un bâtiment dont vous êtes le propriétaire (les inventaires de joueurs sont créés automatiquement)
  - `inventaire description <inventaire> (description)` : Changer la description de l'inventaire
  - `inventaire give <inventaire> <nom d'item> (nombre d'items)` : Ajouter un item
  - `inventaire liste (joueur)` : Lister les inventaires d'un joueur
  - `inventaire move <inventaire source> <inventaire cible> <nom d'item> (nombre d'items)` : Déplacer un item d'un inventaire à un autre
  - `inventaire open (nom d'inventaire)` : Ouvrir un inventaire ou son inventaire
  - `inventaire reload` : Commande de debug, au cas où les inventaires se sont mal chargés
  - `inventaire remove <inventaire> <nom d'item> (nombre d'items)` : Retirer un item

### test (Permissions limitées)

- `test [test]` : commandes de tests
  - `test idtime (nb)` : renvoie les informations de nouveaux channels

### Autres commandes

- `bot` : Arrête le bot (Permissions requises)
- `spacex` : Résumé des informations de vols concernants les Space Flight Operations au dessus du Texas (Starbase).

# Jig0ll

Un bot à tout faire pour Discord

Utilise les interactions Discord (slash commands)

---

## Ajouter @Jig0ll sur votre serveur

Jig0ll n'est pas un bot public pour l'instant

Ajouter Jig0ll avec les interactions sur votre serveur : https://discord.com/api/oauth2/authorize?client_id=494587865775341578&permissions=0&scope=bot%20applications.commands
(nécessite une autorisation)

---

## Liste des Commandes

### Préfixes

- `/[commande]` : préfixe d'interaction, si aucune commande ne s'affiche c'est qu'il y a une faute ou que les interactions ne sont pas autorisées
- `![commande]` : ancien préfixe (sera remplacé par le préfixe / dans le futur)
- `@Jig0ll [commande]` (certaines commandes ne sont pas encore disponibles en interaction, utilisez @Jig0ll à la place)

### Help

- `help` : affiche la liste des commandes
- `help [commande]` : détaille une commande

### Ping

- `ping` : retourne `pong` et le temps de réponse du bot
- `pingBot (max)` : effectue plusieurs `ping` et retourne le ping moyen du bot
- `timeServ` : retourne la différence d'heure entre le serveur et le bot

### Info

- `info [type] (cible)` : Retourne des informations de la cible
  ##### Type
  - `info id (cible)` : L'identifiant
    (Snowflake => https://discord.js.org/#/docs/main/stable/typedef/Snowflake)
  - `info create (cible)` : Date de création
  ##### Cible
  - un Channel ou un Client (`info id @Jig0ll`)
  - Si vide : l'auteur de la commande

### Météo

- `météo <ville/pays>` : La météo actuelle de la ville

### Plénitude

- `plénitude [commande]` : Commandes spécifiques de Plénitude
  - `plénitude météo` : La météo à Plénitude
  - `plénitude info` : Informations sur Plénitude
  - `plénitude invite_score` : Score actuel du concours d'invitations
  - `plénitude invite_end` : Terminer le concours d'invitations et afficher le gagnant
  - `plénitude_location set [ville]` : Change la position de Plénitude
  - `plénitude_location get` : Donne la position de Plénitude

### test (Permissions requises)

- `test <test>` : commandes de tests
  - `test idtime (nb)` : renvoie les id de nouveaux channels ()
  - `test timestamp (channel)` : renvoie la date de création du channel
  - `test snowflake (snowflake)` : renvoie les informations du snowflake

### Autres commandes

- `someone` : choisir un membre aléatoire du channel
- `anonyme <message>` : Faire une annonce anonymement
- `cut` : Arrête le bot (Permissions requises)

# Jig0ll

Un bot à tout faire pour Discord

Jig0ll n'est pas un bot public pour l'instant

Disponible uniquement dans les channels avec `@Jig0ll` dans le topic

---


## Liste des Commandes
### Préfixes
* `![command]`
* `@Jig0ll [command]`

### Help
* `help` : affiche la liste des commandes
* `help [command]` : détaille une commande

### Ping
* `ping` : retourne `pong` et le temps de réponse du bot
* `pingBot (max)` : effectue plusieurs `ping` et retourne le ping moyen du bot
* `timeServ` : retourne la différence d'heure entre le serveur et le bot

### Info
* `info <type> (cible)` : Retourne des informations de la cible
  #### Type
  * `info id (cible)` : L'identifiant
    (Snowflake => https://discord.js.org/#/docs/main/stable/typedef/Snowflake)
  * `info create (cible)` : Date de création
  #### Cible
  * un Channel ou un Client (`info id @Jig0ll`)
  * Si vide : l'auteur de la commande

### Météo
* `meteo <ville/pays>` : La météo actuelle de la ville
* `weather <ville/pays>` : `meteo`

### Plénitude
* `plenitude <commande>` : Commandes spécifiques de Plénitude
  * `plenitude meteo` : La météo à Plénitude
  * `plenitude info` : Informations sur Plénitude
  * `plenitude set <nom> <valeur>` : Change les paramètres de Plénitude
  * `plenitude get <nom>` : Donne les paramètres de Plénitude


### test (Permissions requises)
* `test <test>` : commandes de tests
  * `test idtime (nb)` : renvoie les id de nouveaux channels ()
  * `test timestamp (channel)` : renvoie la date de création du channel
  * `test snowflake (snowflake)` : renvoie les informations du snowflake

### Autres commandes
* `someone` : choisir un membre aléatoire du channel
* `anonyme <message>` : Faire une annonce anonymement
* `cut` : Arrête le bot (Permissions requises)

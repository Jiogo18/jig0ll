module.exports = class CmdHelp
{
	static action (message, msg)
	{
		if(msg.length >= 2)
		{
			var retour = this.withArgument(msg[1])
			if(retour != "")
			{
				message.delete();
				return {embed:{
					color:3447003,
					title:"Help : "+msg[1],
					description: retour,
					author: true
				}};
			}

		}
		message.delete();

		return {embed:{
			color:3447003,
			title:"Help",
			description: "Disponible uniquement dans les channels de nom 'bot' ou 'bots'"+
				"\nhelp (commande): affiche cette liste ou détaille la commande"+
				"\nping : retourne pong"+
				"\npingBot (max): retourne le ping moyen du bots"+
				"\ntimeServ: retourne la différence d'heure entre le serveur et le bot"+
				"\ninfo <type> (cible): retourne des informations du Channel/Client selectionné"+
				"\nsomeone : appel un membre aléatoire du channel"+
				"\nanonyme <message> : Faire une annonce anonymement"+
				//"\n  "+
				//"\n  "+
				//"\n  "+
				"",
			author: true
		}};

	}

	static withArgument (argument)
	{
		switch(argument.toLowerCase())
		{
			case "help":
				return "Donne la liste des commandes disponnibles\n!help (commande) pour détailler la commande";
		
			case "ping":
				return "Vous retourner \"pong\" et le temps de réponse du bot";
		
			case "pingBot":
				return "Retourne le ping moyen du Bot\n!pingBot (max) pour effectuer un certain nombre de tests";
				
			case "timeServ":
				return "  timeServ: retourne la différence d'heure entre le serveur et le bot (désynchronisation possibles)";
		
			case "info":
				return "info <type> (cible)\nRetourne des informations du Channel/Client selectionné\n"+
						"<type> :\n"+
						"ID : retourne l'id du Channel/Client (Snowflake => https://discord.js.org/#/docs/main/stable/typedef/Snowflake)\n"+
						"CreatedAt : retourne la date de création du Channel/Client\n"+
						"(cible) : cible de votre choix, si vide retourne les informations de votre compte";
		}
		return "";
	}
}
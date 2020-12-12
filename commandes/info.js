module.exports = class CmdInfo
{
	static isAction(msg) {
		return msg.length>0 && msg[0].toLowerCase()=="info";
	}
	static action(message,msg)
	{
		if(msg.length < 2)
			return;//pas asser d'arguments

		var cible = message.author;
		if(msg.length >= 3 && msg[2].startsWith("<") && msg[2].endsWith(">"))
		{
			//selectionne l'utilisateur
			if(msg[2].startsWith("<@!"))
				cible = message.author.client.users.cache.find(function(element) {return element==msg[2].replace("<@!","").replace(">","")});
			else if(msg[2].startsWith("<#"))
				cible = message.guild.channels.cache.find(function(element) {return element==msg[2].replace("<#","").replace(">","")});


			if(cible == null)
			{
				console.log(message.content + " : " + msg[2] + " est introuvable");
				return {embed:{
					color:3447003,
					title:"Info Id",
					description: msg[2]+" est introuvable",
					author: true
				}};
			}
		}

		switch(msg[1].toLowerCase())
		{
			case "id":
				return {embed:{
					color:3447003,
					title:"Info Id",
					description: "ID de "+msg[2]+" : "+cible.id,
					author: true
				}};
			case "create":
				return {embed:{
					color:3447003,
					title:"Info CreatedAt",
					description: "Date de création de "+msg[2]+" : "+cible.createdAt,
					author: true
				}};
			default:
				return;
		}
		return;//erreur (plus simple pour rajouter après)
	}
	static getHelp(complet) {
		if(complet) {
			return "info <type> (cible)"+
				"\nRetourne des informations du Channel/Client selectionné"+
				"\n<type> :"+
				"\n\u200b \u200b ID : retourne l'id du Channel/Client (Snowflake => https://discord.js.org/#/docs/main/stable/typedef/Snowflake)"+
				"\n\u200b \u200b Create : retourne la date de création du Channel/Client"+
				"\n(cible) : cible de votre choix, si vide retourne les informations de votre compte";
		}
		else
			return "info <type> (cible): retourne des informations du Channel/Client selectionné";
	}
}
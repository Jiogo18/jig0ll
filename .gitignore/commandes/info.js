module.exports = class CmdRandom
{
	static action (message, msg)
	{
		if(msg.length < 2)
			return;//pas asser d'arguments

		var cible = message.author;
		if(msg.length >= 3 && msg[2].startsWith("<") && msg[2].endsWith(">"))
		{
			if(msg[2].startsWith("<@"))
			{
				cible = message.author.client.users.get(msg[2].replace("<@","").replace(">",""));
			}
			else if(msg[2].startsWith("<#"))
			{
				cible = message.guild.channels.get(msg[2].replace("<#","").replace(">",""));
			}

			if(cible == null)
			{
				console.log(message.content + " : " + msg[2] + " est introuvable");
				return;
			}
		}//selectionne l'utilisateur

		switch(msg[1].toLowerCase())
		{
			case "id":
				message.delete();
				return {embed:{
					color:3447003,
					title:"Info Id",
					description: "ID de "+cible+" : "+cible.id,
					author: true
				}};
			case "createdat":
				message.delete();
				return {embed:{
					color:3447003,
					title:"Info CreatedAt",
					description: "Date de création de "+cible+" : "+cible.createdAt,
					author: true
				}};
			default:
				return;
		}
		return;//erreur (plus simple pour rajouter après)
	}
}
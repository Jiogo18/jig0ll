module.exports = class CmdHelp
{
	static isAction(msg) {
		return msg.length>0 && (msg[0].toLowerCase()=="ping" || msg[0].toLowerCase()=="pingbot" || msg[0].toLowerCase()=="timeserv");
	}
	static action(message, msg, bot)
	{
		var timeNow = Date.now();
		//message.channel.send(msg);
		switch(msg[0].toLowerCase())
		{
			case "ping":
				if(message.author.id == bot.user.id)
				{
					message.delete();
					if(msg.length != 4)
					{
						return {embed:{
							color:13369344,
							title:"Ping",
							description: "erreur ping",
							author: false
						}};
					}
					var msgCreated=msg[2].replace("createdAt:","");
					var msgReceived=msg[3].replace("receivedAt:","");
					var currentTime=timeNow;
					var pingBot = (currentTime-msgReceived)/2;

					console.log("ping du bot : " + pingBot);
					var ping = msgReceived-msgCreated;
					return `pong, <@!${msg[1].replace("author:","")}> ! Réponse en ${ping}ms`+
						`, ping supposé : ${ping - pingBot}ms`+
						`${ping>1000?" (décalage de l'horloge système important)":""}`+
						`, ping du bot : ${pingBot}ms`;
				}
				else
				{
					message.channel.send(`<@!${bot.user.id}> ping author:${message.author.id} createdAt:${message.createdAt.getTime()} receivedAt:${Date.now()}`);
					//id du bot
				}
				break;




			case "pingbot":
				if(message.author.id == bot.user.id)
				{
					message.delete();
					var max = parseInt(msg[2]);
					var repete = parseInt(msg[1]);
					repete++;
					var pingMsg = timeNow - parseInt(msg[4]);
		//peut etre faire la diff avec le serv?
					var pingTotal = parseInt(msg[3]);
					pingTotal += (pingMsg/2);//aller retour
					bot.pings.push(pingMsg/2);

					if(repete < max)//quand c'est pas fini
					{
						message.channel.send(`<@!${bot.user.id}> pingbot ${repete} ${max} ${pingTotal} ${Date.now()}`);//Date.now() important
					}
					else
					{
						console.log(`new pings du bot : ${Math.round(pingTotal/max)} [${bot.pings}]`);
						return {embed:{
							color:3447003,
							title:"Pingbot",
							description: `pingbot moyen sur ${max} envois : ${pingTotal/max}ms`,
							author: 1//bot
						}};
					}
				}
				else//from user
				{
					var max=1;
					if(msg.length >= 2)
					{
						max=msg[1];
						if(max>10)
							max=10;
						if(max<1)
							max=1;
					}
					bot.pings = new Array(0);//clear la liste des pings
					message.channel.send(`<@!${bot.user.id}> pingbot 0 ${max} 0 ${Date.now()}`);//Date.now() important
				}
				break;


			case "timeserv":
				if(message.author.id == bot.user.id)
				{
					message.delete();
					var diff1 = (timeNow+parseInt(msg[1]))/2 - message.createdAt;
					//moyenne entre date.now et actuelle puis diff avec le createdAt du message
					//permet de faire le ping entre les 2 le temps que le msg soit envoyé aux servs discord
					var diff2 = parseInt(msg[1]) - message.createdAt;
					//diff entre date.now et createdAt du message
					return {embed:{
						color:3447003,
						title:"Timeserv",
						description: `Le bot est désynchronisé de ${diff1}ms par rapport au serveur (${diff1<0 ? "retard" : "avance"} de ${Math.round(Math.abs(diff1)/10)/100}s)`,
						author: 1
					}};
				}
				else
					message.channel.send(`<@!${bot.user.id}> timeServ ${Date.now()}`);//Date.now() important
		}
		return;
	}

	static getHelp(complet) {
		switch(complet) {
			case "ping":
				return "Vous retourner \"pong\" et le temps de réponse du bot";
			case "pingbot":
				return "Retourne le ping moyen du Bot"+
					"\n\u200b \u200b pingBot (max) pour effectuer un certain nombre de tests";
			case "timeserv":
				return "timeServ: retourne la différence d'heure entre le serveur et le bot (désynchronisation possibles)"
			default:
				return "ping : retourne pong"+
					"\npingBot (max): retourne le ping moyen du bots"+
					"\ntimeServ: retourne la différence d'heure entre le serveur et le bot";
		}
	}
}
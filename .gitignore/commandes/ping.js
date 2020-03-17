module.exports = class CmdHelp
{
	static action (message, msg, bot, timeNow)
	{
		//message.channel.send(msg);
		switch(msg[0].toLowerCase())
		{
			case "ping":
				if(message.author.id == bot.user.id)
				{
					if(msg.length != 4)
					{
						message.delete();
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
					var pingBot=((currentTime-msgReceived)/2)
					message.delete();
					console.log("ping du bot : " + pingBot);
					return "pong, "+msg[1].replace("author:","")+" ! (réponse en " + (msgReceived-msgCreated) + "msec, ping supposé : " + (msgReceived-msgCreated - pingBot) + "msec, ping du bot : " + pingBot + "msec)";
				}
				else
				{
					message.delete();
					//message.channel.send("!ping author:"+message.author+" createdAt:"+message.createdAt.getTime()+" receivedAt:"+Date.now());
					return "!ping author:"+message.author+" createdAt:"+message.createdAt.getTime()+" receivedAt:"+Date.now();
				}
				break;




			case "pingbot":
				if(message.author.id == bot.user.id)
				{
					var max = parseInt(msg[2]);
					var repete = parseInt(msg[1]);
					repete++;
					var pingMsg = timeNow - parseInt(msg[4]);
		//peut etre faire la diff avec le serv?
					var pingTotal = parseInt(msg[3]);
					pingTotal += (pingMsg/2);//aller retour
					bot.pings.push(pingMsg/2);

					message.delete();
					if(repete < max)
					{
						message.channel.send("!pingbot " + repete + " " + max + " " + pingTotal + " " + Date.now());//Date.now() important
					}
					else
					{
						console.log("new pings du bot : " + Math.round(bot.ping) + " ["+bot.pings+"]");
						return {embed:{
							color:3447003,
							title:"Pingbot",
							description: "pingbot moyen sur " + max + " envois : " + (pingTotal/max) + "ms",
							author: 1//bot
						}};
					}
				}
				else
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
					message.delete();
					message.channel.send("!pingbot 0 " + max + " 0 "+Date.now());//Date.now() important
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
					console.log("diff1="+diff1);
					console.log("diff2="+diff2);
					return {embed:{
						color:3447003,
						title:"Timeserv",
						description: "Le bot est désynchronisé de " + diff1 + "ms par rapport au serveur ("+(diff1<0 ? "retard" : "avance")+" de "+Math.round(Math.abs(diff1)/10)/100+"s)",
						author: 1
					}};
				}
				else
				{
					message.delete();
					message.channel.send("!timeServ " + Date.now());//Date.now() important
				}
		}
		return;
	}
}
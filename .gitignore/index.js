const Discord = require('discord.js')
const bot = new Discord.Client()
//const channelBot = "<#386086319035514890>"
const Cmd = require("./commandes/commande.js")
const Modo = require("./moderation.js")


bot.on("ready", function ()
{
	bot.user.setActivity("!help || @"+bot.user.username+" help", {type: 'WATCHING'})
	.then(presence => console.log(`Activitée de ` +bot.user.username+ ` mis à "${presence.game ? presence.game.name : 'none'}"`))
  .catch(console.error);
})



bot.on("message", function (message)
{
	if(message.content.startsWith("!") || message.content.startsWith(bot.user))
	{
		var msg=message.content;
		var msgSplit=[""];
		if(msg.startsWith("!"))
			//msgSplit[0] = "!";
			msg = message.content.substring(1);
		if(msg.startsWith(bot.user+" "))//a une taille de 18+<@>
			//msgSplit[0] = bot.user+" ";
			msg = message.content.substring(bot.user.length+1);
		//msg = message.content.substring(msgSplit[0].size);
		//msg = commande + argument(s)
		var onStr=false;
		for(i=0; i<msg.length; i++)
		{
			if(msg[i] == "\\")
			{
				i++; continue;//on saute meme le prochain char
			}
			if(msg[i] == "\"")
			{
				onStr = !onStr;
			}
			if(onStr)
				continue;//on continue jusqu'a la fin du str
			if(msg[i] == " ")
			{//prochain arg
				msgSplit[msgSplit.length] = "";//on ajoute une case
				continue;//si on laisse plusieurs cases vides c'est pas grave (erreur de cmd)
			}

			msgSplit[msgSplit.length-1] = msgSplit[msgSplit.length-1] + msg[i];//on ajoute le char
		}


		if(msgSplit[0] == "cut")
			if(message.author.id == 175985476165959681)//mon id
			{
				console.log("Stoppé par " + message.author);
				message.channel.send("Stoppé par " + message.author)//dans n'importe quel channel
				bot.destroy();
			}

		if(message.channel.topic && message.channel.topic.includes("@Jig0ll"))
		{//si c pas ds le channel bot
			//log de commande et arguments
			console.log('nouvelle commande dans ' + message.id + ' (par ' + message.author.id + ') : ' + message.content);
			Cmd.action(bot, message, msgSplit);
		}
		else
		{
			message.channel.send("Disponnible uniquement dans les channels avec '@Jig0ll' dans le topic");
		}
	}
	else
		Modo.action(message);


})



bot.login(process.env.TOKEN)

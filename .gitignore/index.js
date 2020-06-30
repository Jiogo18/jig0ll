require('dotenv').config();
const Discord = require('discord.js');
const bot = new Discord.Client();//id du bot:<@!494587865775341578>
const Cmd = require("./commandes/commande.js");


bot.on("ready", () => {
	bot.user.setActivity("!help || @"+bot.user.username+" help", {type: 'WATCHING'})
			.then(presence => console.log(
				`Activitée de `+bot.user.username+` mis à "${presence.activities.length>0 ? presence.activities[0].name : 'none'}"`))
			.catch(console.error);
});


bot.on("message", message => {
	var msg = Cmd.isCommand(bot, message);
	if(!msg)
		return;
	console.log("nouvelle commande dans " + message.id + " (par " + message.author.username + "@" + message.author.id + ") : " + message.content);

	try {
		Cmd.action(bot, message, msg);
	} catch (error) {
		message.channel.send("Sorry I've had an error:" + error)
		console.error(error);
	}
	
});

bot.login();

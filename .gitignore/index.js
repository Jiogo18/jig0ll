require('dotenv').config();
const Discord = require('discord.js');
const bot = new Discord.Client();//id du bot:<@!494587865775341578>
const Cmd = require("./commandes/commande.js");
var messageNotCmd = [];


bot.on("ready", () => {
	bot.user.setActivity("!help || @"+bot.user.username+" help", {type: 'WATCHING'})
			.then(presence => console.log(
				`Activitée de `+bot.user.username+` mis à "${presence.activities.length>0 ? presence.activities[0].name : 'none'}"`))
			.catch(console.error);
});


bot.on("message", message => {
	try {
		var msg = Cmd.isCommand(bot, message);
		if(!msg) {
			if(!messageNotCmd[message.guild.id])
				messageNotCmd[message.guild.id] = 0;
			if(++messageNotCmd[message.guild.id] >= 200) {//à 200
				messageNotCmd[message.guild.id] = 0;
				console.log("Plus de 200 messages dans "+message.guild.name+"@"+message.guild.id+"/"+message.channel.name+", laissez moi dormir");
			}
			return;
		}
		console.log("nouvelle commande dans " + message.id + " (par " + message.author.username + "@" + message.author.id + ") : " + message.content);
	} catch(error) {
		console.log("Error with a message:" + error);
		return;
	}

	try {
		Cmd.action(bot, message, msg);
	} catch (error) {
		message.channel.send("Sorry I've had an error:" + error);
		console.error(error);
	}
	
});

bot.login();

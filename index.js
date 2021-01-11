require('dotenv').config();
process.env.WIPOnly = process.argv.includes("WIP");

const Discord = require('discord.js');
const bot = new Discord.Client();//id du bot:<@!494587865775341578>
const Cmd = require("./commandes/commande.js");
var messageNotCmd = [];
const interactionManager = require('./interaction/handler.js');
const interactionMgr = new interactionManager(bot);
require('colors');//colors for everyone ! (don't remove)


bot.on(Discord.Constants.Events.CLIENT_READY, () => {
	process.env.BOT_ID = bot.user.id

	bot.user.setActivity(`!help || @${bot.user.username} help`, {type: 'WATCHING'})
			.then(presence => console.log(
				`Activitée de ${bot.user.username} mis à "${presence.activities.length>0 ? presence.activities[0].name : 'none'}"`.cyan))
			.catch(console.error);

	if(process.env.WIPOnly) {
		console.warn(`You are in WIP mode, @${bot.user.username} will only answer on Jiogo18's serv`);
	}

	interactionMgr.loadCommands();
});


bot.on(Discord.Constants.Events.MESSAGE_CREATE, message => {
	
	if(!interactionMgr.config.isAllowed(
		{
			user: message.author,//infos du message
			guild: message.channel.guild,
			channel: message.channel
		}, false))
		return;//pas autorisé

	try {
		var msg = Cmd.isCommand(bot, message);
		if(!msg) {//if it's not a command
			var sourceId = 0, sourceName = "Unknow";
			if(message.guild) {
				sourceId = message.guild.id;
				sourceName = message.guild.name+"@"+sourceId+"/"+message.channel.name;
			}
			else if(message.author) {
				sourceId = message.author.id;
				sourceName = "MP^";
			}

			if(!messageNotCmd[sourceId])
				messageNotCmd[sourceId] = 0;
			if(++messageNotCmd[sourceId] >= 200) {//à 200
				messageNotCmd[sourceId] = 0;
				console.warn(`Plus de 200 messages dans ${sourceName}, laissez moi dormir`);
			}
			return;
		}
		console.log(`nouvelle commande dans ${message.id} (par ${message.author.username}@${message.author.id}) : ${message.content}`);
	} catch(error) {
		console.error(`Error with a message: ${error}`);

		return;
	}

	//2 try catch to answer with the error ONLY when it's a command
	try {
		Cmd.action(bot, message, msg);
	} catch (error) {
		message.channel.send(`Sorry I've had an error: ${error}`);
		console.error(error);
	}
});

bot.login();


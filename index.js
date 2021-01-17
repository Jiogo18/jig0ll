require('dotenv').config();
process.env.WIPOnly = process.argv.includes("WIP") ? true : '';
process.env.HEROKU = process.execPath.includes('heroku') ? true : '';

const Discord = require('discord.js');
const bot = new Discord.Client();//id du bot:<@!494587865775341578>
const libCommand = require("./lib/command.js");
const InteractionManager = require('./Interaction/handler.js');
const interactionMgr = new InteractionManager(bot);
require('colors');//colors for everyone ! (don't remove)
const { CommandMessage } = require('./lib/commandData.js');
const security = require('./Interaction/security.js');

bot.localId = Math.floor(Math.random() * 10000);//id à 4 chiffres

bot.on(Discord.Constants.Events.CLIENT_READY, () => {
	process.env.BOT_ID = bot.user.id

	bot.user.setActivity(`/help || @${bot.user.username} help`, {type: 'WATCHING'})
			.then(presence => console.log(
				`Activitée de ${bot.user.username} mis à "${presence.activities.length>0 ? presence.activities[0].name : 'none'}"`.cyan))
			.catch(console.error);

	if(process.env.WIPOnly) {
		console.warn(`You are in WIP mode, @${bot.user.username} will only answer on Jiogo18's serv`);
	}

	interactionMgr.loadCommands();
});





bot.on(Discord.Constants.Events.MESSAGE_CREATE, async message => {
	
	if(!security.botIsAllowedToDo(
		{
			author: message.author,
			guild: message.channel.guild,
			channel: message.channel,
			on: 'message'
		})
	) { return; }//pas autorisé en WIPOnly


	try {
		const [content, prefix] = libCommand.removePrefix(message.content);
		if(prefix == undefined) return;

		message.content = content;
		message.prefix = prefix;

	} catch(error) {
		console.error(`Error with a message: ${error}`);
		return;
	}

	console.log(`nouvelle commande (par ${message.author.username} @${message.author.id}) : ${message.content}`);


	//on suppose que message.content et message.prefix on été séparés
	var cmdData = new CommandMessage(message, interactionMgr);
	const retour = await interactionMgr.onCommand(cmdData)
		.catch(e => {
			message.channel.send(`Sorry I've had an error: ${error}`);
			console.error(error);
		});
	
	if(!retour) return;
	
	cmdData.sendAnswer(retour)
		.catch(e => {
			message.reply(`Sorry I've had an error while sending the answer: ${error}`);
			console.error(error);
		});
});

bot.login();


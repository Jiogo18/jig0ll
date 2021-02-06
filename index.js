import {config as dotenvConfig} from 'dotenv'; dotenvConfig();
process.env.WIPOnly = process.argv.includes("WIP") ? true : '';
process.env.HEROKU = process.execPath.includes('heroku') ? true : '';

import Discord from 'discord.js';
const bot = new Discord.Client();//id du bot:<@!494587865775341578>
bot.startedTime = Date.now();

import libCommand from './lib/command.js';
import InteractionManager from './Interaction/handler.js';
const interactionMgr = new InteractionManager(bot);
import 'colors';//colors for everyone ! (don't remove)
import { CommandMessage } from './lib/commandData.js';
import security from './Interaction/security.js';


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
	
	if(process.stopped == true) return;
	
	if(!security.botIsAllowedToDo(
		{
			author: message.author,
			guild: message.channel.guild,
			channel: message.channel,
			on: 'message'
		})
	) { return; }//pas autorisé en WIPOnly

	//préparer le message pour les commandes
	try {
		const [content, prefix] = libCommand.removePrefix(message.content);
		if(prefix == undefined) return;

		message.content = content;
		message.prefix = prefix;

	} catch(error) {
		console.error(`Error with a message: ${error}`);
		return;
	}


	//on suppose que message.content et message.prefix ont été séparés
	var cmdData = new CommandMessage(message, interactionMgr);
	const retour = await interactionMgr.onCommand(cmdData)
		.catch(error => {
			message.channel.send(`Sorry I've had an error: ${error}`);
			console.error(error);
		});
	
	if(!retour) return;
	
	console.log(`nouvelle commande (par ${message.author.username} @${message.author.id}) : ${message.content}`);
	
	cmdData.sendAnswer(retour)
		.catch(error => {
			message.reply(`Sorry I've had an error while sending the answer: ${error}`);
			console.error(error);
		});
});

bot.login();


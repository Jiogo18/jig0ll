import { Client, Constants } from "discord.js";

import { removePrefix as removeCommandPrefix } from '../lib/command.js';
import InteractionManager from '../Interaction/handler.js';
var interactionMgr;
import { CommandMessage } from '../lib/commandData.js';
import { botIsAllowedToDo } from '../Interaction/security.js';




export default class DiscordBot extends Client {

	startedTime;
	#stopped = false; get stopped() { return this.#stopped; }
	
	constructor() {
		super();
		this.startedTime = Date.now();

		this.on(Constants.Events.CLIENT_READY, onBotConnected);
		this.on(Constants.Events.MESSAGE_CREATE, onMessage);

		interactionMgr = new InteractionManager(this);
	}


	start() {
		this.#stopped = false;
		this.login();
	}
	stop() {
		this.#stopped = true;
		setTimeout(this.destroy, 1000);
	}
	restart() {
		if(!this.#stopped) this.stop();
		this.start();
	}
}




function onBotConnected() {
	process.env.BOT_ID = this.user.id

	this.user.setActivity(`/help || @${this.user.username} help`, {type: 'WATCHING'})
			.then(presence => console.log(
				`Activitée de ${this.user.username} mis à "${presence.activities.length>0 ? presence.activities[0].name : 'none'}"`.cyan))
			.catch(console.error);

	if(process.env.WIPOnly) {
		console.warn(`You are in WIP mode, @${this.user.username} will only answer on Jiogo18's serv`);
	}
}



async function onMessage(message) {

	if(process.stopped == true || this.stopped) return;
	
	if(!botIsAllowedToDo(
		{
			author: message.author,
			guild: message.channel.guild,
			channel: message.channel,
			on: 'message'
		})
	) { return; }//pas autorisé en WIPOnly

	//préparer le message pour les commandes
	try {
		const [content, prefix] = removeCommandPrefix(message.content);
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
}



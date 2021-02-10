import { Client, Constants, Message } from "discord.js";

import CommandManager from "./command/commandManager.js";
import OldInteractionManager from '../Interaction/base.js';
import InteractionManager from "./command/interactionManager.js";

import { ReceivedInteraction } from "./command/received.js";
import { botIsAllowedToDo } from '../Interaction/security.js';
import messageHandler from './messageHandler.js';
import interactionHandler from "./command/interactionHandler.js";




export default class DiscordBot extends Client {

	startedTime;
	#stopped = false; get stopped() { return this.#stopped; }
	commandMgr;
	interactionMgr;//deprecated
	interactionMgr2;
	
	constructor() {
		super();
		this.startedTime = Date.now();
		this.commandMgr = new CommandManager(this);
		this.interactionMgr = new OldInteractionManager(this);
		this.interactionMgr2 = new InteractionManager(this);

		this.on(Constants.Events.CLIENT_READY, this.onBotConnected);
		this.on(Constants.Events.MESSAGE_CREATE, onMessage);
		this.ws.on('INTERACTION_CREATE', (...a) => onInteraction.call(this, ...a) );
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


	onBotConnected() {
		process.env.BOT_ID = this.user.id
	
		this.user.setActivity(`/help || @${this.user.username} help`, {type: 'WATCHING'})
				.then(presence => console.log(
					`Activitée de ${this.user.username} mis à "${presence.activities.length>0 ? presence.activities[0].name : 'none'}"`.cyan))
				.catch(console.error);
	
		if(process.env.WIPOnly) {
			console.warn(`You are in WIP mode, @${this.user.username} will only answer on Jiogo18's serv`);
		}
	
		this.interactionMgr2.postCommands();
	}
}




/**
 * Récéption d'un message et vérification avant de l'analyser
 * @param {Message} message 
 */
function onMessage(message) {
	if(process.stopped == true || this.stopped) return;

	try {
		if(!botIsAllowedToDo(
			{
				author: message.author,
				guild: message.channel.guild,
				channel: message.channel,
			})
		) { return; }//pas autorisé en WIPOnly


		messageHandler.call(this, message).catch(console.error);

	} catch(error) { console.error(error) }
}


/**
 * Récéption d'une interaction et vérification avant de l'analyser
 * @param {Object} interaction 
 */
function onInteraction(interaction) {
	if(process.stopped == true || this.stopped) return;

	try {
		const cmdData = new ReceivedInteraction(interaction, this.interactionMgr);

		if(!botIsAllowedToDo(cmdData.context)) return;

		interactionHandler.call(this, cmdData);
		
	} catch(error) { console.error(error) }
}
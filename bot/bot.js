import { Client, ClientApplication, Constants, Message } from "discord.js";

import InteractionManager from '../Interaction/handler.js';
import messageHandler from './messageHandler.js';
import { botIsAllowedToDo } from '../Interaction/security.js';



export default class DiscordBot extends Client {

	startedTime;
	#stopped = false; get stopped() { return this.#stopped; }
	interactionMgr;
	
	constructor() {
		super();
		this.startedTime = Date.now();
		this.interactionMgr = new InteractionManager(this);

		this.on(Constants.Events.CLIENT_READY, onBotConnected);
		this.on(Constants.Events.MESSAGE_CREATE, onMessage);
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



/**
 * Récéption d'un message et vérification avant de l'analyser
 * @param {Message} message 
 */
function onMessage(message) {
	if(process.stopped == true || this.stopped) return;


	if(!botIsAllowedToDo(
		{
			author: message.author,
			guild: message.channel.guild,
			channel: message.channel,
		})
	) { return; }//pas autorisé en WIPOnly


	messageHandler.call(this, message);
}
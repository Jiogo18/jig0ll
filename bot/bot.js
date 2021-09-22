import { Client, Constants, Message, Intents } from 'discord.js';

import AppManager from './AppManager.js';
import CommandManager from './command/commandManager.js';
import InteractionManager from './command/interactionManager.js';

import { ReceivedInteraction } from './command/received.js';
import { botIsAllowedToDo } from './command/security.js';
import messageHandler from './messageHandler.js';
import interactionHandler from './command/interactionHandler.js';
import { PGDatabase } from '../lib/database.js';

export default class DiscordBot extends Client {
	startedTime;
	#stopped = false;
	get stopped() {
		return this.#stopped;
	}
	commandMgr;
	interactionMgr;
	commandEnabled = true;
	/**
	 * @type {Promise<boolean>}
	 */
	onReady;

	constructor() {
		super({
			intents: [
				Intents.FLAGS.GUILDS,
				Intents.FLAGS.GUILD_MESSAGES,
				Intents.FLAGS.DIRECT_MESSAGES,
				Intents.FLAGS.GUILD_INTEGRATIONS,
				Intents.FLAGS.GUILD_MEMBERS,
				Intents.FLAGS.GUILD_INVITES,
			],
		});
		this.startedTime = Date.now();
		AppManager.setBot(this);
		this.commandMgr = new CommandManager(this);
		this.interactionMgr = new InteractionManager(this);

		this.onReady = new Promise(res => {
			this.on(Constants.Events.CLIENT_READY, () => res(true));
			this.on(Constants.Events.DISCONNECT, () => res(false));
		});

		this.on(Constants.Events.CLIENT_READY, this.onBotConnected);
		this.on(Constants.Events.MESSAGE_CREATE, onMessage);
		if (this.commandEnabled) {
			this.ws.on('INTERACTION_CREATE', (...a) => onInteraction.call(this, ...a));
		} else {
			console.warn('Commands are disabled by the bot'.yellow);
		}
		this.database = new PGDatabase(process.env.DATABASE_URL);
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
		if (!this.#stopped) this.stop();
		this.start();
	}

	onBotConnected() {
		process.env.BOT_ID = this.user.id;

		try {
			const presence = this.user.setActivity(`/help || @${this.user.username} help`, { type: 'WATCHING' });

			const presenceName = presence.activities?.[0]?.name || 'none';
			console.log(`Activitée de ${this.user.username} mis à "${presenceName}"`.cyan);
		} catch (error) {
			process.consoleLogger.error(error);
		}

		if (process.env.WIPOnly) {
			console.warn(`You are in WIP mode, @${this.user.username} will only answer on Jiogo18's serv`.cyan);
		}

		if (this.commandEnabled) {
			this.interactionMgr.postCommands();
		}
	}
}

/**
 * Récéption d'un message et vérification avant de l'analyser
 * @param {Message} message
 */
function onMessage(message) {
	if (process.stopped == true || this.stopped) return;

	try {
		if (
			!botIsAllowedToDo({
				author: message.author,
				guild: message.channel.guild,
				channel: message.channel,
			})
		)
			return; //pas autorisé en WIPOnly

		messageHandler.call(this, message);
	} catch (error) {
		process.consoleLogger.internalError('onMessage', error);
	}
}

/**
 * Récéption d'une interaction et vérification avant de l'analyser
 * @param {Object} interaction
 */
function onInteraction(interaction) {
	if (process.stopped == true || this.stopped) return;

	try {
		const cmdData = new ReceivedInteraction(interaction, this);

		if (!botIsAllowedToDo(cmdData.context)) return;

		interactionHandler.call(this, cmdData);
	} catch (error) {
		process.consoleLogger.internalError('onInteraction', error);
	}
}

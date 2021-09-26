import { Client, Constants, Message, Intents, Interaction } from 'discord.js';

import AppManager from './AppManager.js';
import CommandManager from './command/commandManager.js';
import InteractionManager from './command/interactionManager.js';

import { ReceivedInteraction } from './command/received.js';
import { botIsAllowedToDo } from './command/security.js';
import messageHandler from './messageHandler.js';
import interactionHandler from './command/interactionHandler.js';
import { PGDatabase } from '../lib/database.js';

export default class DiscordBot extends Client {
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
			partials: ['CHANNEL'],
		});
		this.resetLocalId();
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
		process.stopped = false;
		this.login();
	}
	stop() {
		process.stopped = true;
		setTimeout(() => this.destroy(), 200);
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

	/**
	 * @type {number}
	 */
	get localId() {
		return process.localId;
	}
	set localId(id) {
		process.localId = id;
	}
	/**
	 * Reset the id of this bot if an id of 3 chiffers
	 */
	resetLocalId() {
		const nb = Math.floor(Math.random() * 1000);
		this.localId = nb || 1; // 0 est un @a
	}
	/**
	 * @param {number} idMsg cible tous les bots ou ce bot
	 * @returns this bot is targeted
	 */
	isLocalId(idMsg) {
		return idMsg == 0 || this.localId == idMsg;
	}
}

/**
 * Récéption d'un message et vérification avant de l'analyser
 * @this {DiscordBot}
 * @param {Message} message
 */
function onMessage(message) {
	if (process.stopped == true) return;

	try {
		if (
			!botIsAllowedToDo({
				guild_id: message.guild?.id,
				channel_id: message.channel?.id,
				author_id: message.author?.id,
			})
		)
			return; //pas autorisé en WIPOnly

		messageHandler(this, message);
	} catch (error) {
		process.consoleLogger.internalError('onMessage', error);
	}
}

/**
 * Récéption d'une interaction et vérification avant de l'analyser
 * @this {DiscordBot}
 * @param {Interaction} interaction
 */
function onInteraction(interaction) {
	if (process.stopped == true) return;

	try {
		const cmdData = new ReceivedInteraction(interaction, this);

		if (!botIsAllowedToDo(cmdData.context)) return;

		interactionHandler(cmdData);
	} catch (error) {
		process.consoleLogger.internalError('onInteraction', error);
	}
}

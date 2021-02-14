import { Collection } from 'discord.js';
import { SecurityPlace } from './security.js';
import AppManager from '../AppManager.js';
import config from '../config.js';
import DiscordBot from '../bot.js';
import CommandStored from './commandStored.js';

export default class InteractionManager {

	bot;
	get commands() { return this.bot.commandMgr.commands; }
	interactionsOnline = new Collection();//TODO: un tableau database
	interactionsPosted = new Collection();//commandes postées

	/**
	 * @param {DiscordBot} bot 
	 */
	constructor(bot) {
		this.bot = bot;
	}

	/**
	 * Get interactions posted in the target
	 * @param {string} targetId 
	 * @returns {Promise<Object[]>} JSON de discord TODO: plus d'info
	 */
	async getCommandsOnline(targetId) {
		return this.interactionsOnline.get(targetId);
	}
	/**
	 * Get the interaction posted in the target
	 * @param {string} commandName 
	 * @param {string} targetId 
	 * @returns {Promise<Object>} JSON de discord TODO: plus d'info
	 */
	async getCommandOnline(commandName, targetId) {
		const interactions = await this.getCommandsOnline(targetId);
		if(!interactions) return;
		return interactions.get(commandName);
	}


	/**
	 * Post a command to Discord
	 * Please note that `postCommand` isn't linked to `commandManager::loadCommand`
	 * @param {CommandStored} command The command to post
	 * @param target The target were you want to post
	 * @returns {Promise<boolean>} `true` if the command has been posted, `false` if it's not
	 */
	async postCommand(command, target) {
		const online = await this.getCommandOnline(command, target);
		if(online) {
			console.debug(`Une interaction existe déjà`, online == command.JSON);
			return false;
		}
		const posted = await AppManager.postCommand(command, target);
		//TODO database: this.resetCacheTimer(target);
		if(posted) {
			this.interactionsPosted.set(command.name, command.JSON);
		}
		return posted;
	}

	/**
	 * Post all commands to Discord
	 */
	async postCommands() {
		const targetGlobal = AppManager.getTarget();
		const targetPrivate = AppManager.getTarget(config.guild_test);
		var c = {
			before: this.interactionsPosted.length,
			after: 0,
			total: 0,
			public: 0,
			private: 0,
			wip: 0,
			notposted: 0,
		};

		const commandsToPost = this.commands.array().filter(command => {
			return command.allowedPlacesToCreateInteraction != SecurityPlace.NONE;
		});

		console.log(`Posting ${commandsToPost.length} commands...`.green);

		const commandSent = commandsToPost.map(async command => {
			var target = undefined;
			switch(command.allowedPlacesToCreateInteraction) {
				case SecurityPlace.PUBLIC: target = targetGlobal; break;
				case SecurityPlace.PRIVATE: target = targetPrivate; break;
				default: return;
			}
			
			if(process.env.WIPOnly && target == targetGlobal) target = targetPrivate;//serv privé (en WIP)
			
			if(await this.postCommand(command, target)) {
				if(command.wip) c.wip++;
				switch(target) {
					case targetPrivate: c.private++; break;
					case targetGlobal: c.public++; break;
				}
			}
			else {
				c.notposted++;
			}
		}).filter(c => c!=undefined);
		await Promise.all(commandSent);

		c.total = commandsToPost.length;
		//pas de différence de vitesse : 1246/1277/1369/1694/2502 ms (avec Promise) contre 1237/1267/1676/1752/2239 ms (avec await)
		console.log(`Posted ${c.total} commands : ${c.public} public, ${c.private} private, ${c.wip} wip, ${c.notposted} not posted`.green);

		c.after = this.interactionsPosted.length;
		return c;
	}

	/**
	 * Delete a command for Discord interactions
	 * Please note that this `deleteCommand` is not linked to `commandManager::removeCommand`
	 * @param {CommandStored} command The command to delete
	 * @param {Object} target Where you want to delete it
	 * @returns {Promise<boolean>} `true` if the command has been deleted, `false` if it's not
	 */
	async deleteCommand(command, target) {
		const removed = await AppManager.deleteCommand(command, target);
		//TODO: if(removed) this.resetCacheTimer(target);
		this.interactionsPosted.delete(command.name);
		return removed;
	}

	/**
	 * Clean all Discord interactions of the target
	 * @param {string} targetId Where you want to clean
	 */
	async cleanCommands(targetId) {
		const target = AppManager.getTarget(targetId);

		const commandsOnline = this.getCommandsOnline(targetId)
		if(!commandsOnline) {
			console.warn(`Can't get commands for ${targetId ? targetId : 'Global'}`.yellow);
			return;
		}

		const commandsCleaner = commandsOnline.map(async c => {
			return this.deleteCommand(c, target) ? c : undefined;
		}).filter(c => c != undefined);

		await Promise.all(commandsCleaner);

		const commandsRemnaining = this.getCommandsOnline(targetId);
		if (commandsRemnaining.length) {
			console.error(`${commandsRemnaining.length} Interactions remain after cleanCommands`.red);
		}
		else {
			console.log(`All Interactions of ${target_id ? target_id : 'Global'} have been removed.`);
		}
	}
}
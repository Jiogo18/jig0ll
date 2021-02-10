import { Collection } from 'discord.js';
import { SecurityPlace } from '../../Interaction/security.js';
import { postCommand, removeCommand } from '../../Interaction/AppManager.js';

export default class InteractionManager {

	bot;
	get commands() { return this.bot.commandMgr.commands; }
	interactionsOnline = new Collection();//TODO: un tableau database
	interactionsPosted = [];//commandes postées

	constructor(bot) {
		this.bot = bot;
	}

	/**
	 * Get the interaction posted in the target
	 * @param {string} commandName 
	 * @param {string} target 
	 * @returns JSON de discord TODO: plus d'info
	 */
	async getCommandOnline(commandName, targetId) {
		const interactions = this.interactionsOnline.get(targetId);
		if(!interactions) return;
		return interactions.get(commandName);
	}

	/**
	 * Post a command to Discord
	 * @param {CommandStored} command The command to post
	 * @param target The target were you want to post
	 * @returns {boolean} `true` if the command has been posted, `false` if it's not
	 */
	async postCommand(command, target) {
		const online = await this.getCommandOnline(command, target);
		if(online) {
			console.debug(`Une interaction existe déjà`);
			console.debug(online == command.JSON);
			return false;
		}
		const posted = await postCommand(command, target);
		//TODO database: this.resetCacheTimer(target);
		if(posted) {
			this.interactionsPosted.set(command.name, command.JSON);
		}
		return posted;
	}

	/**
	 * Post all commands to Discord
	 * @param {Object} targetGlobal 
	 * @param {Object} targetPrivate 
	 */
	async postCommands(targetGlobal, targetPrivate) {
		//TODO: arg targetGlobal/targetPrivate doivent être géré depuis interactionManager seulement
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
	 * @param {CommandStored} command The command to delete
	 * @param {Object} target Where you want to delete it
	 * @returns {boolean} `true` if the command has been deleted, `false` if it's not
	 */
	async deleteCommand(command, target) {
		const removed = await removeCommand(command, target);
		//TODO: if(removed) this.resetCacheTimer(target);
		this.interactionsPosted.delete(command.name);
		return removed;
	}
}
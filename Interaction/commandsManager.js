import { Collection } from 'discord.js';
var existingCommands = new Collection();//stocker les commandes et pas les redemander h24//TODO: liste avec database.js car c'est une même fonction pour tous


var bot;

export default {

	async getExistingCommands(target, forceUpdate) {
		var commandsStored = existingCommands.get(target.path);

		if(forceUpdate) {
			console.warn(`getExistingCommands called with forceUpdate.`.yellow);
		}
		
		if(!commandsStored || commandsStored.timeUpdate < Date.now() || forceUpdate) {
			if(commandsStored)
				console.warn(`Asking Discord for existing Commands (ping: ${Date.now() - commandsStored.lastUpdate} ms)`.magenta);

			var commandsGet = [];
			try {
				commandsGet = await target.r.get();
			} catch(error) {
				console.warn(`Can't get commands from ${target.r}, it's maybe empty`.yellow);
				commands = [];
			}
			commandsStored = {
				commands: commandsGet,
				lastUpdate: Date.now(),
				timeUpdate: Date.now() + 1000
			}
			existingCommands.set(target.path, commandsStored);
		}
		return commandsStored.commands;
	},

	resetCacheTimer(target) {
		var commands = existingCommands.get(target.path);
		if(commands) commands.timeUpdate = 0;
	},

	async getCommand(commandName, target) {
		return command = (await this.getExistingCommands(target))
			.find(command => command.name == commandName);
	},
	async getCommandId(commandName, target) {
		const command = await this.getCommand(commandName, target);
		return command ? command.id : undefined;
	},



	get commands() { return bot.commandMgr.commands },//les commandes stockées par le bot (avec les execute())
	setBot(b) { bot = b; },//temporaire

	async addCommand(...o) {
		// on ecrasera forcément les anciens post car on sait pas s'ils sont utilisés (ils restent même si le bot est off)
		console.debug(`CommandsManager::addCommand is deprecated`.yellow);
		return bot.interactionMgr2.addCommand(...o);
	},

	async removeCommand(...o) {
		console.debug(`CommandsManager::removeCommand is deprecated`.yellow);
		return bot.interactionMgr2.deleteCommand(...o);
	},

	async postCommands(...o) {
		console.debug(`CommandsManager::postCommands is deprecated`.yellow);
		return bot.interactionMgr2.postCommands(...o);
	},
}

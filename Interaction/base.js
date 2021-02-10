import security from './security.js';
import AppManager from './AppManager.js';
import commandsMgr from './commandsManager.js';

export default class InteractionBase {
	bot = undefined;
	commandsMgr = commandsMgr;

	constructor(bot) {
		//format des demandes d'interactions '</COMMAND:BOT_ID> '
		//format des retours d'interactions: 'réponse'
		this.bot = bot;
		AppManager.setBot(bot);
		commandsMgr.setBot(bot);
		this.loadCommands().then(posted => {
			if(!posted) bot.on('ready', () => { this.postCommands() });
		});
	}

	global = AppManager.getGlobal;
	guilds = AppManager.getGuild;
	getTarget = AppManager.getTarget;
	getCmdFrom = AppManager.getCmdFrom;

	async loadCommands() {
		await this.bot.commandMgr.loadCommands();
		if(this.bot && this.bot.user) {//charger les commandes si c'est possible
			this.postCommands();
			return true;
		}
		return false;
	}
	async postCommands() {
		const targetPrivate = this.getTarget(security.guild_test);
		const targetGlobal = this.getTarget();
		return this.commandsMgr.postCommands(targetGlobal, targetPrivate);
	}

	async cleanCommands(target_id = undefined) {
		const target = this.getTarget(target_id);

		const commandsAvailable = await this.commandsMgr.getExistingCommands(target);
		if (!commandsAvailable) {
			console.error(`Can't get commands for ${target_id ? target_id : 'Global'}`);
			return;
		}

		//console.log(`commands before : ${(await this.commandsMgr.getExistingCommands(target)).length}`);
		var promises = [];
		for (const command of commandsAvailable) {
			promises.push(this.commandsMgr.removeCommand(command, target));
		}
		await Promise.all(promises);
		//console.log(`commands remaning : ${(await this.commandsMgr.getExistingCommands(target)).length}`)

		if (this.commandsMgr.commands.length > 0) {
			console.error(`${this.commandsMgr.commands.length} Slash Commands remain after cleanCommands`.red);
		}
		else {
			console.log(`All Slash Commands of ${target_id ? target_id : 'Global'} have been removed.`);
		}
	}
}


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
		return this.bot.interactionMgr2.postCommands();
	}

	async cleanCommands(target_id) {
		console.debug(`InteractionBase::cleanCommands is deprecated`.yellow);
		this.bot.interactionMgr2.cleanCommands(target_id);
	}
}


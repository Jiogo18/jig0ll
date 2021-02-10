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
	}

	global = AppManager.getGlobal;
	guilds = AppManager.getGuild;
	getTarget = AppManager.getTarget;
	getCmdFrom = AppManager.getCmdFrom;


	async cleanCommands(target_id) {
		console.debug(`InteractionBase::cleanCommands is deprecated`.yellow);
		this.bot.interactionMgr2.cleanCommands(target_id);
	}
}


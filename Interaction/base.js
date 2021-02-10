import commandsMgr from './commandsManager.js';

export default class InteractionBase {
	bot = undefined;
	commandsMgr = commandsMgr;

	constructor(bot) {
		this.bot = bot;
		commandsMgr.setBot(bot);
	}
}


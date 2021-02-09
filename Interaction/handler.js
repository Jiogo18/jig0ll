import InteractionBase from './base.js';

export default class InteractionManager extends InteractionBase {
	constructor(bot) {
		super(bot);

		this.loadCommands().then(posted => {
			if(!posted) bot.on('ready', () => { this.postCommands() });
		});
	}
}


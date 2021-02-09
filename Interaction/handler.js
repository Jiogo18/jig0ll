import InteractionBase from './base.js';
import { MessageMaker } from '../lib/messageMaker.js';


export default class InteractionManager extends InteractionBase {
	constructor(bot) {
		super(bot);

		this.loadCommands().then(posted => {
			if(!posted) bot.on('ready', () => { this.postCommands() });
		});
	}


	async onCommand(cmdData) {
		var command;
		try {
			command = this.commandsMgr.getCommand(cmdData.commandName);
		}
		catch(error) {
			console.warn(error.yellow);
			return new MessageMaker(error);
		}
		if(!command) return;
		if(typeof command == 'string') {
			return new MessageMaker(command);
		}


		try {
			const retour = await new Promise((resolve, reject) => {
				resolve(command.execute(cmdData, cmdData.options));//try to solve with it
				setTimeout(() => reject('timeout'), 60000);//more than 60s
			});
			if(!retour) {
				console.warn(`Command "${cmdData.commandLine}" has no answer`.yellow);
			}
			return retour;

		} catch (error) {
			console.error(`An error occured will executing "${cmdData.commandLine}"`.red, error);
			return new MessageMaker(`Sorry I've had an error (${error})`);
		}
	}
}


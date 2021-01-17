const InteractionBase = require('./base.js');
const { CommandInteraction } = require('../lib/commandData.js');
const MessageMaker = require('../lib/messageMaker.js');
const security = require('./security.js');

module.exports = class InteractionManager extends InteractionBase {
	constructor(bot) {
		super(bot);

		bot.ws.on('INTERACTION_CREATE', inte => { this.onInteraction(inte); });//to keep the function with the right 'this'
	}


	async onInteraction(interaction) {
		
		const cmdData = new CommandInteraction(interaction, this);

		if(security.botIsAllowedToDo(cmdData) == false) return;

		const retour = await this.onCommand(cmdData);
		console.log(`Interaction done for ${cmdData.author.username} : "${cmdData.commandLine}"`);

		const answerOk = await cmdData.sendAnswer(retour)
			.catch(e => {
				console.error(`Error while sending an answer`.red);
				console.error(e);
			})
		if(!answerOk)
			console.warn(`Interaction "${cmdData.commandLine}" has no answer`.yellow);
	}


	async onCommand(cmdData) {
		const [command, lastArg] = this.commandsMgr.getCommandForData(cmdData);
		if(!command) {
			if(lastArg.startsWith('Command unknow: ')) return;
			console.warn(lastArg);
			return new MessageMaker.Message(lastArg);
		}
		else if(typeof command == 'string') {
			return new MessageMaker.Message(command);
		}


		try {
			if(typeof command.execute != 'function') {
				if(command.description) return new MessageMaker.Message(command.description);
				
				console.warn(`Can't find execute() for ${lastArg}`.yellow);
				return new MessageMaker.Message(`execute is not defined for this option`);
			}

			const retour = await command.execute(cmdData);
			return retour;

		} catch (error) {
			console.error(`An error occured will executing "${cmdData.commandLine}"`.red, error);
			return new MessageMaker.Message(`Sorry I've had an error`);
		}
	}
}


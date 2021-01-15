const InteractionBase = require('./base.js');
const CommandData = require('./commandData.js');

module.exports = class InteractionManager extends InteractionBase {
	constructor(bot) {
		super(bot);

		bot.ws.on('INTERACTION_CREATE', inte => { this.onInteraction(inte); });//to keep the function with the right 'this'
	}


	async onInteraction(interaction) {

		const cmdData = new CommandData(CommandData.source.INTERACTION, interaction, this);

		const retour = await this.onCommand(cmdData);
		console.log(`Interaction done for ${cmdData.author.username} : "${cmdData.commandLine}"`);

		if(!cmdData.sendAnswer(retour))
			console.warn(`Interaction "${cmdData.commandLine}" has no answer`.yellow);
	}


	async onCommand(cmdData) {
		const [command, lastArg] = this.commandsMgr.getCommandForData(cmdData);
		if(!command) {
			console.warn(lastArg);
			if(process.env.WIPOnly)
				return lastArg;
			return;
		}
		else if(typeof command == 'string') {
			return command;
		}


		try {
			if(typeof command.execute != 'function') {
				console.warn(`Can't find execute() for ${lastArg}`.yellow);
				throw "execute is not defined for this option";
			}

			return await command.execute(cmdData);

		} catch (error) {
			console.error(`An error occured will executing "${cmdData.commandLine}"`.red, error);
			return `Sorry I've had an error`;
		}
	}
}


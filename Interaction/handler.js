const InteractionBase = require('./base.js');
const { CommandInteraction } = require('./commandData.js');

module.exports = class InteractionManager extends InteractionBase {
	constructor(bot) {
		super(bot);

		bot.ws.on('INTERACTION_CREATE', inte => { this.onInteraction(inte); });//to keep the function with the right 'this'
	}


	async onInteraction(interaction) {
		
		const cmdData = new CommandInteraction(interaction, this);

		const retour = await this.onCommand(cmdData);
		console.log(`Interaction done for ${cmdData.author.username} : "${cmdData.commandLine}"`);

		const answerOk = cmdData.sendAnswer(retour)
			.then(() => {
				if(!answerOk)
					console.warn(`Interaction "${cmdData.commandLine}" has no answer`.yellow);
			})
			.catch(e => {
				console.error(`Error while sending an answer`.red);
				console.error(e);
			})
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


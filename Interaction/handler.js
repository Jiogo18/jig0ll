const InteractionBase = require('./base.js');
const { CommandInteraction } = require('../lib/commandData.js');
const MessageMaker = require('../lib/messageMaker.js');
const security = require('./security.js');
const Snowflake = require('../lib/snowflake.js');


async function safeInteractionAnswer(cmdData) {
	const timestampId = Snowflake.getDateSinceEpoch(cmdData.commandSource.id);
	//ne fonctionne que si la commande fonctionne au await (pas au sleep des dates)
	const timeRemaining = 3000 + timestampId - Date.now();
	const t = setTimeout(async function() {
		if(cmdData.answered) return;
		console.log(`Interaction is too long, an aknowledgment will be sent`);
		cmdData.sendAnswer(new MessageMaker.InteractionSpecial(5));//accepte l'intéraction (et attent le retour)
	}, timeRemaining - 500);//on a 3s pour répondre à l'interaction (et le bot peut être désyncro de 1s...)
}

module.exports = class InteractionManager extends InteractionBase {
	constructor(bot) {
		super(bot);

		bot.ws.on('INTERACTION_CREATE', inte => { this.onInteraction(inte); });//to keep the function with the right 'this'
	}


	async onInteraction(interaction) {
		
		if(process.stopped == true) return;
		
		const cmdData = new CommandInteraction(interaction, this);

		if(security.botIsAllowedToDo(cmdData) == false) return;


		safeInteractionAnswer(cmdData);


		const retour = await this.onCommand(cmdData);
		console.log(`Interaction done for ${cmdData.author.username} : "${cmdData.commandLine}"`);

		if(!retour) return;

		const answerOk = await cmdData.sendAnswer(retour)
			.catch(e => {
				console.error(`Error while sending an answer`.red);
				console.error(e);
			})
		if(!answerOk)
			console.warn(`Interaction "${cmdData.commandLine}" has no answer`.yellow);
			cmdData.answered = true;
	}


	async onCommand(cmdData) {
		var command;
		try {
			command = this.commandsMgr.getCommandForData(cmdData);
		}
		catch(error) {
			console.warn(error.yellow);
			return new MessageMaker.Message(error);
		}
		if(!command) return;
		if(typeof command == 'string') {
			return new MessageMaker.Message(command);
		}


		try {
			if(typeof command.execute != 'function') {
				if(command.description) return new MessageMaker.Message(command.description);
				
				console.warn(`Can't find execute() for ${command.name}`.yellow);
				return new MessageMaker.Message(`execute is not defined for this option`);
			}




			const retour = await command.execute(cmdData);
			if(!retour) {
				console.warn(`Command "${cmdData.commandLine}" has no answer`.yellow);
			}
			return retour;

		} catch (error) {
			console.error(`An error occured will executing "${cmdData.commandLine}"`.red, error);
			return new MessageMaker.Message(`Sorry I've had an error`);
		}
	}
}


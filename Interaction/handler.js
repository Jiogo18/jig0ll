const InteractionBase = require('./base.js');
const CommandData = require('./commandData.js');

module.exports = class InteractionManager extends InteractionBase {
	constructor(bot) {
		super(bot);

		bot.ws.on('INTERACTION_CREATE', inte => { this.onInteraction(inte); });//to keep the function with the right 'this'
	}


	async onInteraction(interaction) {

		const cmdData = new CommandData('interaction', interaction, {bot: this.bot, interaction: this, commands: this.commandsMgr.commands});

		const retour = await this.onCommand(cmdData);
		console.log(`Interaction done for ${cmdData.author.username} : "${cmdData.commandLine}"`);

		if(retour)
			this.sendAnswer(interaction, retour);
		else
			console.warn(`Interaction "${cmdData.commandLine}" has no answer`.yellow);
	}


	async onCommand(cmdData) {
		var command = this.commandsMgr.commands.get(cmdData.commandName);

		if(!command) {
			console.warn(`Command unknow: ${cmdData.commandName}`);

			if(process.env.WIPOnly)
				return `Command unknow: ${cmdData.commandName}`;

			return;
		}

		
		if(!InteractionBase.config.isAllowed(cmdData, command.security)) {
			return `You can't do that`;
		}


		var lastArg = cmdData.commandName;

		for(let i=0; i<cmdData.options.length; i++) {//get the sub command named optionName
			const optionName = cmdData.getOptionType(i);

			var subCommand = command.options ? command.options.find(option => option.name == optionName || (optionName==true && 3 <= option.type)) : undefined;
			if(subCommand == undefined) {
				console.error(`Option unknow: ${cmdData.commandName} ${optionName}`);
				if(process.env.WIPOnly)
					return `Option unknow: ${optionName}`;
				return;
			}
			if(!InteractionBase.config.isAllowed(cmdData, subCommand.security)) {
				return `You can't do that`;
			}
			command = subCommand;
			lastArg = optionName;
		}


		try {
			if(typeof command.execute != 'function') {
				console.error(`Can't find execute() for ${lastArg}`.red);
				throw "execute is not defined for this option";
			}

			return await command.execute(cmdData, cmdData.application);

		} catch (error) {
			console.error(`An error occured will executing "${cmdData.commandLine}"`.red, error);
			return `Sorry I've had an error`;
		}
	}
}


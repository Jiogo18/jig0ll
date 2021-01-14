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
			//on compare Name et option.name (le nom de l'option)
			//si c'est un message (text) on a Name==true car:
			// => si c'est une sous commande : Value est le nom de la sous commande (on compare Value et name)
			// => sinon type est >=3 (string, number, boolean, ...) donc optionValue peut être n'importe quoi
			const optionName = cmdData.getOptionType(i);
			const optionValue = cmdData.getOptionValue(i);
			const optionNa = optionName!=true ? optionName : optionValue;

			var subCommand;
			if(command.options)
				subCommand = command.options.find(option => option.name == optionNa || (optionName==true && 3 <= option.type));
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
				console.warn(`Can't find execute() for ${lastArg}`.yellow);
				throw "execute is not defined for this option";
			}

			return await command.execute(cmdData, { interaction: cmdData.interactionMgr, bot: cmdData.bot, commands: cmdData.commands });

		} catch (error) {
			console.error(`An error occured will executing "${cmdData.commandLine}"`.red, error);
			return `Sorry I've had an error`;
		}
	}
}


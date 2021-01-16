const InteractionConfig = require('../Interaction/config.js');
const MessageMaker = require('../Interaction/messageMaker.js');
const { CommandData, CommandContent } = require('../Interaction/commandData.js');

function makeMessage(description, error) {
	const color = error ? 'red' : undefined;
	return new MessageMaker.Embed('Help', description, {color: color});
}

module.exports = {
	name: 'help',
	description: 'Affiche les commandes disponibles',
	interaction: false,//pas dans interaction
	public: true,


	options: [{
		name: "command",
		description: "Détail une commande",
		type: 3,

		execute(cmdData) {
			var commandToHelp = [...cmdData.content.optionsValue];
			const commandLine = commandToHelp.join(' ');
			const cmdData2 = new CommandData(new CommandContent(commandToHelp.shift(), commandToHelp), cmdData.context, cmdData.commandSource, cmdData.interactionMgr);

			const [command] = cmdData.interactionMgr.commandsMgr.getCommandForData(cmdData2, true);

			if(typeof command == 'string') { return makeMessage(command, true); }
			if(!command) { return module.exports.execute(cmdData); }
			if(!command.description) { return console.warn(`${command.name} has no description`.yellow); }

			const optionsDescTab = getDescriptionFor(cmdData, command.options);
			var optionsDesc = '';
			if(optionsDescTab && optionsDescTab.length > 0) {
				var optionsDescStr = [];
				for(const line of optionsDescTab) {
					optionsDescStr.push(`\xa0 \xa0 /${commandLine} ${line.name} : ${line.description}`);
				}
				optionsDesc = '\n' + optionsDescStr.join('\n');
				//affiche une liste avec une indentation et un retour à la ligne
			}
			return makeMessage(command.description + optionsDesc);
		}
	}],

	execute(cmdData) {
		const description = getDescriptionFor(cmdData, cmdData.commands);
		var descriptionStr = [];
		for(const line of description) {
			descriptionStr.push(`\xa0 \xa0 ${line.name} : ${line.description}`);
		}
		return makeMessage(descriptionStr.join('\n'));
	}
};




function getDescriptionFor(context, commands) {
	if(!commands) return [];

	var retour = [];
	commands.forEach((command, key) => {
		if(!InteractionConfig.isAllowedToSee(command, context)) {
			return;
		}
		var commandName = command.name;
		if(command.type >= 3)
			commandName = `[${commandName}]`;
		retour.push({ name: commandName, description: command.description });
	});

	return retour;
}
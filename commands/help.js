const InteractionConfig = require('../Interaction/config.js');
const MessageMaker = require('../Interaction/messageMaker.js');

function makeMessage(description, error) {
	const color = error ? 'red' : undefined;
	return new MessageMaker.Embed('Help', description, {color: color});
}

module.exports = {
	name: 'help',
	description: 'Affiche les commandes disponibles, ',
	interaction: false,//pas dans interaction
	public: true,
	wip: true,


	options: [{
		name: "command",
		description: "Détail une commande",
		type: 3,

		execute(context) {
			var commandToHelp = [...context.optionsValue];
			const commandLine = commandToHelp.join(' ');
			var context2 = context.clone();
			context2.commandName = commandToHelp.shift();
			context2.options = commandToHelp;
			const [command] = context.interactionMgr.commandsMgr.getCommandForData(context2, true);

			if(typeof command == 'string') { return makeMessage(command, true); }
			if(!command) { return module.exports.execute(context); }
			if(!command.description) { return makeMessage(`${command.name} has no description`, true); }

			const optionDescTab = getDescriptionFor(context, command.options);
			var optionsDesc = '';
			if(optionDescTab && optionDescTab.length > 0) {
				var optionDescStr = [];
				for(const line of optionDescTab) {
					optionDescStr.push(`\xa0 \xa0 /${commandLine} ${line.name} : ${line.description}`);
				}
				optionDesc = '\n' + optionDescStr.join('\n');
				//affiche une liste avec une indentation et un retour à la ligne
			}
			return makeMessage(command.description + optionDesc);
		}
	}],

	execute(context) {
		const description = getDescriptionFor(context, context.commands);
		var descriptionStr = [];
		for(const line of description) {
			descriptionStr.push(`${line.name} : ${line.description}`);
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
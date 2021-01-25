const security = require('../Interaction/security.js');
const MessageMaker = require('../lib/messageMaker.js');
const { CommandData, CommandContent } = require('../lib/commandData.js');

function makeMessage(description, error) {
	const color = error ? 'red' : undefined;
	return new MessageMaker.Embed('Help', description, {color: color});
}

function getCommandToHelp(cmdData) {
	var commandToHelp = [...cmdData.content.optionsValue];
	if(commandToHelp[0] && commandToHelp[0].includes('')) {
		const first = commandToHelp.shift();
		for(const word of first.split(' ').reverse()) {
			commandToHelp.unshift(word);
		}
		console.debug(commandToHelp);
	}

	const commandLine = commandToHelp.join(' ');
	const cmdData2 = new CommandData(new CommandContent(commandToHelp.shift(), commandToHelp), cmdData.context, cmdData.commandSource, cmdData.interactionMgr);

	const command = cmdData.interactionMgr.commandsMgr.getCommandForData(cmdData2, true);
	return [command, commandLine];
}



module.exports = {
	name: 'help',
	description: 'Affiche les commandes disponibles',
	interaction: true,

	security: {
		place: 'public',
	},

	options: [{
		name: "command",
		description: 'Détaille une commande (/help "bot info")',
		type: 3,
		required: false,

		execute(cmdData) {

			const [command, commandLine] = getCommandToHelp(cmdData);

			if(typeof command == 'string') { return makeMessage(command, true); }
			if(!command) { console.debug("todo: '/help bot info'"); return module.exports.execute(cmdData); }
			if(!command.description) { return console.warn(`${command.name} has no description`.yellow); }

			return makeMessage(getFullDescriptionFor(cmdData, command, commandLine));
			
		}
	}],

	execute(cmdData) {
		return makeMessage(getBetterDescriptionFor('\u200b \u200b \u200b \u200b ', cmdData, cmdData.commands, ''));
	},

	getDescriptionFor: getDescriptionFor,
	getFullDescriptionFor: getFullDescriptionFor,
};

//get a complete description of the command
function getFullDescriptionFor(context, command, commandLine) {
	return command.description + '\n' + getBetterDescriptionFor('\xa0 \xa0 ', context, command.options, commandLine);
}

//get a readable description of options
function getBetterDescriptionFor(spaces, context, options, commandLine) {
	const description = getDescriptionFor(context, options);
	var descriptionStr = [];
	if(commandLine != '') commandLine += ' ';
	for(const line of description || []) {
		descriptionStr.push(spaces + `/${commandLine}${line.name} : ${line.description}`);
	}
	//affiche une liste avec une indentation et un retour à la ligne
	return descriptionStr.join('\n');
}

//get the description with objects
function getDescriptionFor(context, commands) {
	if(!commands) return [];

	var retour = [];
	commands.forEach((command, key) => {
		if(!command.security.isAllowedToSee(context)) {
			return;
		}
		var commandName = command.name;
		if(command.type >= 3)
			commandName = `[${commandName}]`;
		retour.push({ name: commandName, description: command.description });
	});

	return retour;
}
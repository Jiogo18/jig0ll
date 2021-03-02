import { EmbedMaker } from '../../lib/messageMaker.js';
import { ReceivedCommand } from '../../bot/command/received.js';

/**
 * Make a Help message
 * @param {string} description
 * @param {boolean} error
 */
function makeMessage(description, error) {
	const color = error && 'red';
	return new EmbedMaker('Help', description, { color: color });
}

/**
 * get a command base on the option given
 * @param {ReceivedCommand} cmdData
 * @param {Array} levelOptions
 */
function getCommandToHelp(cmdData, levelOptions) {
	const commandName = levelOptions.shift().value;

	const command = cmdData.bot.commandMgr.getCommand(commandName, true);
	if (!command) return;

	const [subCommand] = command.getSubCommand(levelOptions);
	if (!subCommand.security.isAllowedToSee(cmdData.context)) {
		return `You can't do that`;
	}
	return subCommand;
}

export default {
	name: 'help',
	description: 'Affiche les commandes disponibles',
	interaction: true,

	security: {
		place: 'public',
	},

	options: [
		{
			name: 'command',
			description: 'Détaille une commande (/help "bot info")',
			type: 3,
			required: false,
		},
	],

	/**
	 * Executed with option(s)
	 * @param {ReceivedCommand} cmdData
	 * @param {[{value:string]} levelOptions
	 */
	executeAttribute(cmdData, levelOptions) {
		//split options with spaces
		var levelOptions2 = [];
		levelOptions.forEach(option => {
			levelOptions2 = [...levelOptions2, ...option.value.split(' ').map(v => ({ name: v, value: v }))];
		});
		const command = getCommandToHelp(cmdData, levelOptions2);

		if (typeof command == 'string') {
			return makeMessage(command, true);
		}
		if (!command) {
			return this.execute(cmdData);
		}
		if (!command.description) {
			return console.warn(`${command.name} has no description`.yellow);
		}
		const helpDesc = command.getHelpDescription(cmdData.context);
		if (helpDesc.constructor == EmbedMaker) return helpDesc;
		return makeMessage(helpDesc);
	},

	/**
	 * Executed when there is no valid option
	 * @param {ReceivedCommand} cmdData
	 */
	execute(cmdData) {
		return makeMessage(getFullDescription('\u200b \u200b \u200b \u200b ', cmdData, cmdData.commands));
	},
};

/**
 * get a readable description of options
 * @param {string} spaces - indentation
 * @param {CommandContext} context
 * @param {CommandStored} commands
 */
function getFullDescription(spaces, context, commands) {
	//every commands
	var commandsDesc = commands
		.sort((a, b) => (a.name < b.name ? -1 : 1))
		.map(command => command.getHelpSmallDescription(context)?.replace(/\n/g, '\n' + spaces + spaces))
		.filter(c => c != undefined)
		.join('\n' + spaces);
	if (commandsDesc != '') commandsDesc = `\n${spaces}${commandsDesc}`;

	commandsDesc = "Préfix du bot : '!', '@Jig0ll', compatible avec les interactions" + commandsDesc;
	return commandsDesc;
}

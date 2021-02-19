import { EmbedMaker } from '../../lib/messageMaker.js';
import { ReceivedCommand } from '../../bot/command/received.js';

/**
 * Make a Help message
 * @param {string} description 
 * @param {boolean} error 
 */
function makeMessage(description, error) {
	const color = error && 'red';
	return new EmbedMaker('Help', description, {color: color});
}

/**
 * get a command base on the option given
 * @param {ReceivedCommand} cmdData 
 * @param {Array} levelOptions 
 */
function getCommandToHelp(cmdData, levelOptions) {
	const commandToHelp = levelOptions.map(o => o.value);

	if(typeof commandToHelp[0] == 'string') {
		const first = commandToHelp.shift();
		for(const word of first.split(' ').reverse()) {
			commandToHelp.unshift(word);
		}
	}
	
	const commandName = commandToHelp.shift();

	const command = cmdData.bot.commandMgr.getCommand(commandName, true);
	if(!command) return;
	const [subCommand,] = command.getSubCommand(commandToHelp);
	if(!subCommand.security.isAllowedToSee(cmdData.context)) {
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

	options: [{
		name: "command",
		description: 'Détaille une commande (/help "bot info")',
		type: 3,
		required: false,

	}],

	/**
	 * Executed with option(s)
	 * @param {ReceivedCommand} cmdData 
	 * @param {[*]} levelOptions
	 */
	executeAttribute(cmdData, levelOptions) {
		const command = getCommandToHelp(cmdData, levelOptions);

		if(typeof command == 'string') { return makeMessage(command, true); }
		if(!command) { return this.execute(cmdData); }
		if(!command.description) { return console.warn(`${command.name} has no description`.yellow); }

		return makeMessage(command.getHelpDescription(cmdData.context));
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
	var commandsDesc = commands.sort((a,b) => a.name < b.name ? -1 : 1).map(command => {
		//description?.replace() because description can be undefined
		return command.getHelpSmallDescription(context)?.replace(/\n/g, '\n' + spaces + spaces);
	}).filter(c => c!=undefined).join('\n' + spaces);
	if(commandsDesc != '') commandsDesc = `\n${spaces}${commandsDesc}`;

	commandsDesc = "Préfix du bot : '!', '@Jig0ll', compatible avec les interactions" + commandsDesc;
	return commandsDesc;
}
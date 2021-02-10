import { EmbedMaker } from '../../lib/messageMaker.js';
import { ReceivedCommand, CommandContent } from '../../bot/command/received.js';

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
	

	const cmdData2 = new ReceivedCommand(new CommandContent(commandToHelp.shift(), commandToHelp), cmdData.context, cmdData.commandSource, cmdData.interactionMgr);

	const command = cmdData.interactionMgr.commandsMgr.getCommandForData(cmdData2, true);
	return command;
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

	executeAttribute(cmdData, levelOptions) {
		const command = getCommandToHelp(cmdData, levelOptions);

		if(typeof command == 'string') { return makeMessage(command, true); }
		if(!command) { return this.execute(cmdData); }
		if(!command.description) { return console.warn(`${command.name} has no description`.yellow); }

		return makeMessage(command.getHelpDescription(cmdData.context));
	},

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
		return command.getHelpSmallDescription(context).replace(/\n/g, '\n' + spaces + spaces);
	}).join('\n' + spaces);
	if(commandsDesc != '') commandsDesc = `\n${spaces}${commandsDesc}`;

	commandsDesc = "Préfix du bot : '!', '@Jig0ll', compatible avec les interactions" + commandsDesc;
	return commandsDesc;
}
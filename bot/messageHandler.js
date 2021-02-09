import { Message } from 'discord.js';
import { removePrefix as removeCommandPrefix } from '../lib/command.js';
import { CommandMessage } from '../lib/commandData.js';
import commandHandler from './commandHandler.js';


/**
 * Read every messages that the bot can read
 * @param {Message} message
 */
export default async function messageHandler(message) {

	if(isCommand(message)) {
		onMessageCommand.call(this, message)
		.catch(error => console.error(`Error with a command: ${error}`) );
	}
}


/**
 * Preparer le message pour les commandes
 * @param {Message} message
 */
function isCommand(message) {
	if(message.isCommand) return true;

	const [content, prefix] = removeCommandPrefix(message.content);
	if(prefix == undefined) return;

	message.content = content;
	message.prefix = prefix;
	message.isCommand = true;
	return prefix != undefined;
}

/**
 * Read every commands from a message
 * @param {Message} message
 */
async function onMessageCommand(message) {
	if(!isCommand(message)) return;

	console.log(`nouvelle commande (par ${message.author.username} @${message.author.id}) : ${message.content}`);

	var command = new CommandMessage(message, this.interactionMgr);
	await commandHandler.call(this, command)
	.catch(error => {
		message.reply(`Sorry I've had an error while sending the answer: ${error}`);
		console.error(`Error while sending an answer for '${command.commandLine}'`.red);
		console.error(error);
	});
}
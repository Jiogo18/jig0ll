import { Message } from 'discord.js';
import { removePrefix as removeCommandPrefix } from '../lib/command.js';
import { CommandMessage } from '../lib/commandData.js';


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

	var command = new CommandMessage(message, this.interactionMgr);
	const retour = await this.interactionMgr.onCommand(command)
		.catch(error => {
			message.reply(`Sorry I've had an error: ${error}`);
			console.error(error);
		});

	if(!retour) return;

	console.log(`nouvelle commande (par ${message.author.username} @${message.author.id}) : ${message.content}`);

	command.sendAnswer(retour)
		.catch(error => {
			message.reply(`Sorry I've had an error while sending the answer: ${error}`);
			console.error(error);
		});
}
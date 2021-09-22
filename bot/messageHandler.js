import { Message } from 'discord.js';
import { extractPrefix } from '../lib/commandTools.js';
import { ReceivedMessage } from './command/received.js';
import commandHandler from './command/commandHandler.js';
import DiscordBot from './bot.js';

/**
 * Read every messages that the bot can read
 * @this {DiscordBot}
 * @param {Message} message
 */
export default async function messageHandler(message) {
	if (isCommand(message) && this.commandEnabled) {
		onMessageCommand.call(this, message).catch(error => process.consoleLogger.commandError('messageHandler', message.content + '\n\n' + error));
	}
}

/**
 * Preparer le message pour les commandes
 * @param {Message} message
 */
function isCommand(message) {
	if (message.isCommand) return true;

	const [content, prefix] = extractPrefix(message.content);
	if (prefix == undefined) return;

	message.content = content;
	message.prefix = prefix;
	message.isCommand = true;
	return prefix != undefined;
}

/**
 * Read every commands from a message
 * @this {DiscordBot}
 * @param {Message} message
 */
async function onMessageCommand(message) {
	if (!isCommand(message)) return;

	var command = new ReceivedMessage(message, this);
	commandHandler.call(this, command).catch(error => {
		message.reply(`Sorry I've had an error while sending the answer: ${error}`);
		process.consoleLogger.error(`Error while sending an answer for '${command.commandLine}' ${error}`.red);
	});
}

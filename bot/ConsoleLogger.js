import { Client, TextChannel } from 'discord.js';

/**
 * @param {string} name
 * @param {string} description
 */
async function internalError(name, description, ..._) {
	/**
	 * @type {Client}
	 */
	const bot = process.bot;
	if (!bot) return false;
	/**
	 * @type {TextChannel}
	 */
	const log_channel = await bot.channels.fetch('858620313117917184'); // #error-log
	if (!log_channel) return false;

	console.error(`Error with ${name}`.red + ` : ${description}`, ..._);
	return !!log_channel.send(`Error with ${name} :\n${description}`);
}

/**
 * @param {string} command
 * @param {string} description
 */
async function commandError(command, description) {
	return internalError(`'${command}'`, description);
}

export default process.consoleLogger = {
	debug: (t = '', ..._) => console.debug(t.red, ..._),
	log: (t = '', ..._) => console.log(t, ..._),
	warn: (t = '', ..._) => console.warn(t.yellow, ..._),
	error: (t = '', ..._) => internalError('error', t, ..._),
	internalError,
	commandError,
};

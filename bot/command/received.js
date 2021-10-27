import { MessageMaker, EmbedMaker } from '../../lib/messageMaker.js';
import { splitCommand } from '../../lib/commandTools.js';
import { Channel, Guild, Message, Interaction as DiscordInteraction, User, Constants, CommandInteraction } from 'discord.js';
import DiscordBot from '../bot.js';
import { ApplicationCommandOptionTypes } from './commandStored.js';

class CommandInteractionOption {
	/**
	 * @type {string}
	 */
	name;
	/**
	 * @type {ApplicationCommandOptionTypes}
	 */
	type;
	/**
	 * @type {string | number | boolean}
	 */
	value;
}

class Interaction extends DiscordInteraction {
	/**
	 * @type {string}
	 */
	guild_id;
	/**
	 * @type { {type: number, options?: CommandInteractionOption[], name: string, id: string} }
	 */
	data;
	/**
	 * @type {string}
	 */
	channel_id;
	/**
	 * @type {string}
	 */
	application_id;
}

export class CommandArgument {
	value;
	type;
	name;
	static BooleanTrue = [true, 'true', 'vrai', 'oui', 'on', '1', 1];
	static BooleanFalse = [false, 'false', 'faux', 'non', 'off', '0', 0];

	/**
	 * @param {CommandInteractionOption|string} option
	 */
	constructor(option) {
		if (typeof option == 'object') {
			this.value = option.value;
			this.type = option.type;
			this.name = option.name;
		} else {
			this.value = option;
		}
	}

	getValueOrName() {
		return this.value !== undefined ? this.value : this.name;
	}

	getNameOrValue() {
		return this.name !== undefined ? this.name : this.value;
	}

	/**
	 * @return `true` if it's *maybe* an argument, `false` if it's a subcommand
	 */
	canBeArgument() {
		if (this.type == undefined) {
			if (this.name !== undefined && this.value === undefined) return false; // subcommand
			return true; // Maybe
		}
		if (this.type >= Constants.ApplicationCommandOptionTypes.STRING) return this.type; // Yes
		return false; // No
	}

	/**
	 * @return `true` if it's *maybe* a subcommand, `false` if it's an argument
	 */
	canBeSubcommand() {
		if (this.type !== undefined) {
			if (this.type === 1 || this.type === 2) return true; // subcommand
			return false; // No
		}
		if (this.name !== undefined && this.value === undefined) return true; // subcommand
		return true; // Maybe
	}

	isSnowflake() {
		return typeof this.value == 'string' && !!this.value.match(/^\d{10,20}$/);
	}

	isDiscordTag() {
		return typeof this.value == 'string' && !!this.value.match(/^<\W\W?\d{10,20}>$/);
	}

	getSnowflake() {
		if (typeof this.value !== 'string') return;
		if (this.value.match(/^\d{10,20}$/)) return this.value;
		return this.value.match(/^<\W\W?(\d{10,20})>$/)?.[1];
	}

	/**
	 * @param {CommandLevelOptions.OptionTypes} type
	 */
	canBeOptionOfType(type) {
		// Interaction
		if (this.type) return this.type === type;
		if (typeof this.value != 'string') throw 'Unexpected value in non-interaction option';

		// Message
		switch (type) {
			case ApplicationCommandOptionTypes.APPLICATION_COMMAND:
				return false;
			case ApplicationCommandOptionTypes.SUB_COMMAND_GROUP:
			case ApplicationCommandOptionTypes.SUB_COMMAND:
				return true;
			case ApplicationCommandOptionTypes.STRING:
				return true;
			case ApplicationCommandOptionTypes.INTEGER:
			case ApplicationCommandOptionTypes.NUMBER:
				return !isNaN(new Number(this.value.replace(',', '.')));
			case ApplicationCommandOptionTypes.BOOLEAN:
				return CommandArgument.BooleanTrue.includes(this.value.toLowerCase()) || CommandArgument.BooleanFalse.includes(this.value.toLowerCase());
			case ApplicationCommandOptionTypes.USER:
				return this.value.match(/^<@!?(\d{10,20})>$/) || this.isSnowflake();
			case ApplicationCommandOptionTypes.CHANNEL:
				return this.value.match(/^<#(\d{10,20})>$/) || this.isSnowflake();
			case ApplicationCommandOptionTypes.ROLE:
				return this.value.match(/^<@&(\d{10,20})>$/) || this.isSnowflake();
			case ApplicationCommandOptionTypes.MENTIONABLE:
				return this.value.match(/^<@[!&]?(\d{10,20})>$/) || this.isSnowflake(); // USER or ROLE
			default:
				throw 'ApplicationCommandOptionTypes unknow';
		}
	}

	/**
	 * @param {CommandLevelOptions.OptionTypes} type
	 */
	getArgumentValue(type) {
		// Interaction
		if (typeof this.value === 'number') return this.value;
		if (typeof this.value === 'boolean') return this.value;

		// Message
		switch (type) {
			case ApplicationCommandOptionTypes.APPLICATION_COMMAND:
			case ApplicationCommandOptionTypes.SUB_COMMAND_GROUP:
			case ApplicationCommandOptionTypes.SUB_COMMAND:
				return this.getValueOrName();
			case ApplicationCommandOptionTypes.STRING:
				return this.value;
			case ApplicationCommandOptionTypes.INTEGER:
			case ApplicationCommandOptionTypes.NUMBER:
				return new Number(this.value.replace(',', '.'));
			case ApplicationCommandOptionTypes.BOOLEAN:
				if (CommandArgument.BooleanTrue.includes(this.value.toLowerCase())) return true;
				if (CommandArgument.BooleanFalse.includes(this.value.toLowerCase())) return false;
				if (process.env.WIPOnly) console.warn(`Argument ${this.value} is not a Boolean`.yellow);
				return this.value;
			case ApplicationCommandOptionTypes.USER:
			case ApplicationCommandOptionTypes.CHANNEL:
			case ApplicationCommandOptionTypes.ROLE:
			case ApplicationCommandOptionTypes.MENTIONABLE:
				return this.getSnowflake();
			default:
				throw 'ApplicationCommandOptionTypes unknow';
		}
	}
}

export class CommandLevelOptions {
	/**
	 * @type {CommandArgument[]}
	 */
	options;

	get length() {
		return this.options.length;
	}

	static OptionTypes = Constants.ApplicationCommandOptionTypes;

	constructor(options) {
		this.options = options;
	}

	clone() {
		return new CommandLevelOptions([...this.options]);
	}

	/**
	 * @return {[CommandArgument,CommandLevelOptions]}
	 */
	getNextLevelOptions() {
		const clone = this.clone();
		return [clone.options.shift(), clone];
	}

	/**
	 * @param {string} name
	 * @param {number} defaultPos
	 */
	getArgument(name, defaultPos) {
		var argument = this.options.find(o => o.name === name);
		if (!argument) argument = this.options[defaultPos];
		return argument;
	}

	/**
	 * @param {string} name
	 * @param {number} defaultPos
	 */
	getArgumentValue(name, defaultPos) {
		return this.getArgument(name, defaultPos)?.value;
	}
}

export class CommandContent {
	/**
	 * @type {string}
	 */
	commandName;
	/**
	 * @type {CommandLevelOptions}
	 */
	levelOptions;
	/**
	 * @type {string}
	 */
	commandLine;

	/**
	 * @param {string} commandName
	 * @param {CommandLevelOptions} levelOptions
	 */
	constructor(commandName, levelOptions) {
		this.commandName = commandName;
		this.levelOptions = levelOptions;
	}

	/**
	 * Make a CommandContent from an interaction
	 * @param {CommandInteraction} interaction
	 */
	static fromInteraction(interaction) {
		const options = [];
		var suboptions = interaction.options.data.map(option => option);
		while (suboptions && suboptions.length > 0) {
			const suboption = suboptions.shift();
			options.push(new CommandArgument(suboption));

			// Passer aux options de la sous commande
			// il n'y a qu'une sous commande OU plusieurs arguments par options
			if (suboptions.length == 0 && suboption.options) suboptions = suboption.options;
		}

		const content = new CommandContent(interaction.commandName, new CommandLevelOptions(options));
		content.commandLine = [content.commandName, ...content.levelOptions.options.map(o => `"${o.getValueOrName()}"`)].join(' ');
		return content;
	}

	/**
	 * Make a CommandContent from a message
	 * @param {Interaction} message
	 */
	static fromMessage(message) {
		const options = splitCommand(message.content) || []; //on suppose que le préfix est enlevé
		const firstOption = options.shift();
		const levelOptions = new CommandLevelOptions(options.map(option => new CommandArgument({ value: option })));

		const content = new CommandContent(firstOption, levelOptions);
		content.commandLine = message.content;
		return content;
	}
}

export class CommandContext {
	bot;
	/** @param {DiscordBot} bot */
	constructor(bot) {
		this.bot = bot;
	}
	/** @return {string} */
	get guild_id() {}
	getCacheGuild() {
		return this.bot.guilds.cache.get(this.guild_id);
	}
	/** @return {Promise<Guild>} */
	getGuild() {}
	/** @return {string} */
	get channel_id() {}
	/** @return {Promise<Channel>} */
	getChannel() {}
	/**  @return {string} */
	get author_id() {}
	/** @return {User|import('discord-api-types').APIUser} */
	getAuthor() {}
	getFullAuthor() {
		return this.bot.users.fetch(this.author_id);
	}
	getCacheGuildAuthor() {
		return this.getCacheGuild()?.members.cache.get(this.author_id);
	}
	async getFullGuildAuthor() {
		return (await this.getGuild())?.members?.fetch(this.author_id);
	}
}

class CommandContextInteraction extends CommandContext {
	interaction;

	/**
	 * Make a CommandContext from an interaction
	 * @param {CommandInteraction} interaction
	 * @param {DiscordBot} bot
	 */
	constructor(interaction, bot) {
		super(bot);
		this.interaction = interaction;
	}

	get guild_id() {
		return this.interaction.guildId;
	}
	getGuild() {
		return this.bot.guilds.fetch(this.interaction.guildId);
	}
	get channel_id() {
		return this.interaction.channelId;
	}
	getChannel() {
		return this.bot.channels.fetch(this.interaction.channelId);
	}
	get author_id() {
		return this.interaction.member?.user?.id || this.interaction.user?.id;
	}
	getAuthor() {
		return this.interaction.user;
	}
}

class CommandContextMessage extends CommandContext {
	message;

	/**
	 * Make a CommandContext from a message
	 * @param {Message} message
	 */
	constructor(message, bot) {
		super(bot);
		this.message = message;
	}

	get guild_id() {
		return this.message.guildId;
	}
	getGuild() {
		return this.message.guild;
	}
	get channel_id() {
		return this.message.channelId;
	}
	getChannel() {
		return this.message.channel;
	}
	get author_id() {
		return this.message.author.id;
	}
	getAuthor() {
		return this.message.author;
	}
}

/**
 * Get a MessageMaker for the given message
 * @param {MessageMaker|EmbedMaker|string} message The message to transform
 */
function makeSafeMessage(message) {
	if (message == undefined) {
		return undefined;
	}
	if (message.constructor != MessageMaker && message.constructor != EmbedMaker) {
		console.error(`ReceivedCommand::sendAnswer Message not created with MessageMaker : ${message}`.red);
		if (message.type == 'rich') return new EmbedMaker(message.title, message.description, message.cosmetic, message.fields);
		else return new MessageMaker(message);
	}
	return message;
}

export class ReceivedCommand {
	content;

	get commandName() {
		return this.content.commandName;
	}
	get levelOptions() {
		return this.content.levelOptions;
	}
	get commandLine() {
		return this.content.commandLine;
	}

	#context;
	get context() {
		return this.#context;
	}
	get author() {
		return this.context.getAuthor();
	}
	get isInteraction() {
		return false;
	}
	get isPrivateMessage() {
		return false;
	}
	get isMessage() {
		return false;
	}
	get sourceType() {
		if (this.isInteraction) return 'interaction';
		if (this.isPrivateMessage) return 'message privé';
		if (this.isMessage) return 'message';
		return 'Unknow';
	}

	/**
	 * @type {Interaction|Message} The message or the interaction
	 */
	get commandSource() {}
	get id() {
		return this.commandSource?.id;
	}
	get bot() {
		return this.context.bot;
	}

	receivedAt;
	answeredAt = -1;

	/**
	 * @param {CommandContent} content
	 * @param {CommandContextInteraction|CommandContextMessage} context
	 */
	constructor(content, context) {
		this.content = content;
		this.#context = context;
		this.receivedAt = Date.now();
	}

	/**
	 * Send the answer to the target
	 * @param {MessageMaker|EmbedMaker} message The answer
	 * @return {Promise<boolean>} a `falsy` value if the answer was not sent
	 */
	async sendAnswer(message) {
		throw `ReceivedCommand can't answer`;
	}
}

export class ReceivedInteraction extends ReceivedCommand {
	/**
	 * @type {CommandContextInteraction}
	 */
	get context() {
		return super.context;
	}

	get interaction() {
		return this.context.interaction;
	}
	get commandSource() {
		return this.context.interaction;
	}

	/**
	 * @param {Interaction} interaction The interaction received
	 * @param {DiscordBot} bot
	 */
	constructor(interaction, bot) {
		super(CommandContent.fromInteraction(interaction), new CommandContextInteraction(interaction, bot));
	}

	get isInteraction() {
		return true;
	}

	/**
	 * Send the answer to the command
	 * @param {MessageMaker|EmbedMaker} answer The answer
	 */
	async sendAnswer(answer) {
		answer = makeSafeMessage(answer);
		if (!answer) return false;

		try {
			this.answeredAt = Date.now();
			return this.interaction.reply(answer.getForMessage());
		} catch (error) {
			process.consoleLogger.error(`ReceivedCommand can't answer ${this.sourceType}, error: ${error.httpStatus}`.red);
		}

		const channel = await this.context.getChannel();
		const answer_for_message = answer.getForMessage({ author: this.author });
		this.answeredAt = Date.now();
		if (channel?.send) return channel.send(answer_for_message);
		return (await this.context.getFullAuthor()).send(answer_for_message);
	}
}
export class ReceivedMessage extends ReceivedCommand {
	/**
	 * @type {CommandContextMessage}
	 */
	get context() {
		return super.context;
	}

	get message() {
		return this.context.message;
	}
	get commandSource() {
		return this.context.message;
	}

	/**
	 * @param {Message} message
	 * @param {DiscordBot} bot
	 */
	constructor(message, bot) {
		super(CommandContent.fromMessage(message), new CommandContextMessage(message, bot));
	}

	get isMessage() {
		return true;
	}
	get isPrivateMessage() {
		return this.message.channel.type == 'DM' || this.message.channel.type == 'GROUP_DM' || this.message.channel.type == 'UNKNOWN';
	}

	/**
	 * Send the answer to the command
	 * @param {MessageMaker|EmbedMaker} answer The answer
	 */
	async sendAnswer(answer) {
		answer = makeSafeMessage(answer);
		if (!answer) return false;

		this.answeredAt = Date.now();
		if (answer.type == 3) {
			//don't reply
			return await this.message.channel.send(answer.getForMessage());
		}
		return await this.message.reply(answer.getForMessage());
	}
}

export default {
	CommandArgument,
	CommandContent,
	CommandContext,
	ReceivedCommand,
	ReceivedInteraction,
	ReceivedMessage,
};

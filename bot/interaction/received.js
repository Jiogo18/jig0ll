import { CommandInteraction, Message, MessagePayload } from 'discord.js';
import { EmbedMaker, MessageMaker } from '../../lib/messageMaker.js';
import DiscordBot from '../bot.js';
import { CommandContent, CommandContext, makeSafeMessage, ReceivedCommand } from '../command/received.js';

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
	 * @param {CommandInteraction} interaction The interaction received
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

	/**
	 * @param {string | MessagePayload} options The answer
	 * @return {Promise<Message>}
	 */
	async reply(options) {
		return await this.interaction.reply({ ...options, fetchReply: true });
	}

	/**
	 * @param {string |  MessagePayload} options The answer
	 */
	async replyNoFetch(options) {
		return await this.interaction.reply(options);
	}
}

import { Message, MessageActionRow, MessageButton, MessageComponentInteraction, MessageEmbed, MessagePayload } from 'discord.js';
import { ReceivedCommand } from './received.js';

export class MessageInteraction {
	cmdData;
	/** @type {Message} */
	answerMessage;
	/** @type {Function} */
	#resolvePromiseActivated;

	/**
	 * @param {ReceivedCommand} cmdData
	 */
	constructor(cmdData) {
		this.cmdData = cmdData;
	}

	/**
	 * @param {MessagePayload} answer
	 */
	async sendAnswer(answer) {
		if (this.answerMessage) {
			if (!await this.answerMessage.edit(answer)) {
				await this.cmdData.reply(answer);
			}
			this.cmdData.bot.removeInteractionHandler(this.answerMessage.id);
		} else this.answerMessage = await this.cmdData.reply(answer);

		return this.answerMessage;
	}

	/**
	 * @param {number} timeout
	 */
	async fetchActivity(timeout) {
		if (!this.answerMessage) return;

		/** @type {Promise<MessageComponentInteraction>} */
		const promiseActivated = new Promise((resolve, reject) => {
			this.#resolvePromiseActivated = resolve;

			if (timeout) {
				setTimeout(() => {
					promiseActivated.catch(() => this.cmdData.bot.removeInteractionHandler(this.answerMessage?.id));
					reject();
				}, timeout);
			}
		});

		this.cmdData.bot.addInteractionHandler(this.answerMessage.id, interaction => this.#resolvePromiseActivated?.(interaction));

		return await promiseActivated;
	}

	/**
	 * @param {MessagePayload} answer
	 * @param {number} timeout
	 */
	async sendAnswerAndFetchActivity(answer, timeout = 60000) {
		await this.sendAnswer(answer);
		return await this.fetchActivity(timeout);
	}

	async removeAnswerMessage() {
		if (this.answerMessage) {
			if (this.answerMessage.deletable) await this.answerMessage.delete();
			this.cmdData.bot.removeInteractionHandler(this.answerMessage.id);
			this.answerMessage = undefined;
		}
		this.#resolvePromiseActivated = undefined;
	}
}

export class MessageInteractionBox extends MessageInteraction {
	/**
	 * @param {MessageEmbed} embed
	 * @param {MessageButton[]} buttons
	 */
	async sendMessageBox(embed, buttons) {
		var components = [];
		if (buttons) {
			const messageAction = new MessageActionRow();
			buttons.forEach(button => messageAction.addComponents(button));
			components.push(messageAction);
		}
		var answer = {
			embeds: [embed],
			components: components,
			fetchReply: true,
		};
		return await super.sendAnswerAndFetchActivity(answer);
	}

	async setDisabled(disable = true) {
		this.answerMessage.components.forEach(messageAction => messageAction.components.forEach(component => component.setDisabled(disable)));
		return await super.sendAnswer(this.answerMessage);
	}
}

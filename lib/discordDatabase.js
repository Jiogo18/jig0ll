import { TemporaryList } from './database.js';
import { TextChannel, Message, User } from 'discord.js';

async function getMessageData(channel, id) {
	if (!channel) return;

	var messages = await channel.messages.fetch({ limit: 100 });
	if (messages.size == 100) {
		console.warn(`MessageData : limite des 100 messages atteinte`);
	}
	messages = messages?.filter(m => m.author.id == process.env.BOT_ID && JSON.parse(m.content)?.id === id);

	if (!messages || messages.size == 0) return;
	if (messages.size > 1) {
		console.warn(`MessageData : plusieurs messages existent pour l'id ${id} (${messages.size} trouvés)`.yellow);
	}
	const message = messages.size >= 1 ? messages.first() : messages;
	return [message, JSON.parse(message)];
}

class MessageData {
	/**
	 * lien vers le message (si existe)
	 * le message n'est créé que lors de la 1er sauvegarde
	 * le message n'est réédité que lors des autres sauvegardes
	 * le message est lu avec load()
	 * @type {Message}
	 */
	message;
	/**
	 * @type {Promise<boolean>}
	 */
	messageLoading;

	channel;

	id;
	data = {};

	/**
	 * @param {TextChannel} channel Channel des messages
	 * @param {string} id Id du message
	 */
	constructor(channel, id) {
		this.channel = channel;
		this.id = id;
		this.messageLoading = this.load(channel, id); // mettre un await sur le message
	}

	toJSON() {
		return JSON.stringify({ ...this.data, id: this.id });
	}

	async load() {
		const retour = await getMessageData(this.channel, this.id);
		if (!retour || !retour[0]) return false; // si perte de connexion, on n'efface pas
		[this.message, this.data] = retour;
		this.messageLoading = undefined;
		return true;
	}

	async save() {
		if (!this.message) {
			// si le message n'est pas encore chargé
			if (!this.messageLoading || !(await this.messageLoading)) {
				// et que load ne l'a pas trouvé
				if (!this.channel) {
					return false;
				}
				this.message = this.channel.send(this.toJSON());
				return true;
			}
		}
		this.message.edit(this.toJSON());
		return true;
	}
}

export class DiscordChannelDatabase {
	channel;
	list;

	/**
	 * @param {TextChannel} channel
	 * @param {number} timeout
	 */
	constructor(channel, timeout = 1000) {
		this.channel = channel;
		this.list = new TemporaryList(
			{
				get: async k => {
					var md = new MessageData(channel, k);
					await md.messageLoading;
					return md;
				},
				set: (k, v) => v.save(), // on suppose que k == v.id
			},
			timeout
		);
	}

	/**
	 * @param {string} invID The inventory id
	 * @return {Promise<MessageData>}
	 */
	async getMessageData(invID) {
		return this.list.get(invID);
	}

	/**
	 * @param {string} invID The inventory id
	 */
	async getData(invID) {
		return (await this.getMessageData(invID)).data;
	}

	/**
	 * @param {string} invID The inventory id
	 */
	async saveData(invID) {
		(await this.getMessageData(invID)).save();
	}
}

import { TemporaryList } from './database.js';
import { TextChannel, Message, User } from 'discord.js';
import YAML from 'yaml'; // YAML is better to see the content with discord
import { MessageEmbed } from 'discord.js';

/**
 * @param {Message} m
 * @param {string} id
 */
function parseAndMatchMessage(m, id) {
	if (!m.author.id == process.env.BOT_ID) return false;

	const embed = m.embeds?.[0];
	if (!embed) return false;
	if (m.embeds.length > 1) {
		console.warn(`Warning : Multiple embeds in the same MessageData`.yellow);
	}
	m.data = YAML.parse(embed.description);

	m.data_id = m.data.id;
	delete m.data.id; // Don't need it in the data

	return m.data_id === id;
}

/**
 * @param {TextChannel} channel
 * @param {string} id
 */
async function getMessageData(channel, id) {
	if (!channel) return;

	var messages = await channel.messages.fetch({ limit: 100 });
	if (messages.size == 100) {
		console.warn(`MessageData : limite des 100 messages atteinte`);
	}
	messages = messages.filter(m => parseAndMatchMessage(m, id));

	if (messages.size == 0) return;
	if (messages.size > 1) {
		console.warn(`MessageData : plusieurs messages existent pour l'id ${id} (${messages.size} trouvés)`.yellow);
	}
	return messages.first();
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
	get exist() {
		return !!this.message;
	}

	/**
	 * @param {TextChannel} channel Channel des messages
	 * @param {string} id Id du message
	 */
	constructor(channel, id) {
		this.channel = channel;
		this.id = id;
		this.load();
	}

	stringify() {
		return YAML.stringify({ ...this.data, id: this.id });
	}

	/**
	 * Wait for the message and store the result (true/false) in messageLoading
	 */
	async load() {
		return (this.messageLoading = new Promise(async res => {
			if (this.exist && parseAndMatchMessage(await this.message.fetch(true), this.id)) {
				// We have reloaded the message
				this.data = this.message.data;
			} else {
				// We are looking for the message
				const retour = await getMessageData(this.channel, this.id);

				if (!retour) return res(false); // don't erase the data, it can be an error
				this.message = retour;
				this.data = retour.data;
			}

			this.messageLoading = undefined;
			res(true);
		}));
	}

	/**
	 * Save the data by editing the message or by sending it
	 */
	async save() {
		const embed = new MessageEmbed({ description: this.stringify() });

		if (this.exist || ((await this.messageLoading) && this.exist)) {
			// We have the message
			// Or we loaded the message
			return this.message.edit(embed);
		} else {
			// If we don't have the message
			if (!this.channel) throw 'No channel specified';
			this.message = await this.channel.send(embed);
			return this.message;
		}
	}
}

export class DiscordChannelDatabase {
	channel;
	/**
	 * a TemporaryList for temporary messages
	 */
	list;

	/**
	 * @param {TextChannel} channel
	 * @param {number} timeout
	 */
	constructor(channel, timeout = 1000) {
		this.channel = channel;
		this.list = new TemporaryList(
			{
				/**
				 * Get/Reload the message
				 * @param {string} ID
				 * @param {MessageData} previousValue
				 */
				get: async (ID, previousValue) => {
					if (previousValue?.message?.fetch && parseAndMatchMessage(await previousValue.message.fetch(true), ID)) {
						return previousValue; // Reload complete !
					}
					var md = new MessageData(channel, ID);
					await md.messageLoading;
					return md;
				},
				/**
				 * Set/Save the message
				 * @param {string} ID
				 * @param {MessageData} v
				 */
				set: (ID, v) => v.save(), // on suppose que k == v.id
			},
			timeout
		);
	}

	/**
	 * @param {string} ID The id of the message
	 * @return {Promise<MessageData>}
	 */
	async getMessageData(ID) {
		return this.list.get(ID);
	}

	/**
	 * @param {string} ID The id of the message
	 */
	async getData(ID) {
		return (await this.getMessageData(ID)).data;
	}

	/**
	 * @param {string} ID The id of the message
	 */
	async saveData(ID) {
		(await this.getMessageData(ID)).save();
	}
}

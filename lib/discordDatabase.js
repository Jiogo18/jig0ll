import { TemporaryList } from './database.js';
import { TextChannel, Message, Collection } from 'discord.js';
import YAML from 'yaml'; // YAML is better to see the content with discord
import { MessageEmbed } from 'discord.js';

/**
 * @param {Message} m
 * @param {string} id
 */
function parseAndMatchMessage(m, id) {
	if (!m) return false;
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
 * @param {Message} message
 */
async function fetchMessage(message) {
	try {
		return await message.fetch(true);
	} catch (e) {
		process.consoleLogger.internalError(e + '\nPossible reason: the message was deleted when fetching it', message);
	}
}

/**
 * @param {TextChannel} channel
 * @param {string} id
 */
async function getMessageData(channel, id) {
	if (!channel) return;

	var messages = await channel.messages.fetch({ limit: 100 });
	var messagesMatch = Array.from(messages.filter(m => parseAndMatchMessage(m, id)).values());

	if (messages.size == 100) {
		const tries_count = 1;
		while (messages.size >= 100 && messagesMatch.size == 0) {
			messages = await channel.messages.fetch({ limit: 100, before: messages.last().id });
			messagesMatch = Array.from(messages.filter(m => parseAndMatchMessage(m, id)).values());
			tries_count++;
		}
		console.warn(
			`MessageData : limite des 100 messages atteinte, fini après ${tries_count} essais. Message ${messageMatch.size ? 'Trouvé' : 'Introuvable'}}`
		);
	}

	if (messagesMatch.size == 0) return;
	const firstMessage = messagesMatch.shift();
	if (messagesMatch.size > 0) {
		console.warn(`MessageData : plusieurs messages existent pour l'id ${id} (${(messagesMatch.size = 1)} trouvés)`.yellow);
		messagesMatch.forEach(m => m.delete());
	}
	return firstMessage;
}

export class MessageData {
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
	 * @type {number}
	 */
	color = 3447003;

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
			if (this.exist && parseAndMatchMessage(await fetchMessage(this.message), this.id)) {
				// We have reloaded the message
			} else {
				// We are looking for the message
				const retour = await getMessageData(this.channel, this.id);
				if (!retour) return res(false); // don't erase the data, it can be an error
				this.message = retour;
			}

			this.data = this.message.data;
			this.color = this.message.embeds?.[0]?.color;
			if (typeof this.color != 'number') this.color = 3447003;

			this.messageLoading = undefined;
			res(true);
		}));
	}

	/**
	 * Save the data by editing the message or by sending it
	 */
	async save() {
		const embed = new MessageEmbed({ description: this.stringify(), color: this.color });

		if (this.exist || ((await this.messageLoading) && this.exist)) {
			// We have the message
			// Or we loaded the message
			return this.message.edit({ embeds: [embed] });
		} else {
			// If we don't have the message
			if (!this.channel) throw 'No channel specified';
			this.message = await this.channel.send({ embeds: [embed] });
			return this.message;
		}
	}

	async delete() {
		if (!this.exist) return true;
		return this.message.delete();
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
					if (previousValue?.message?.fetch && !previousValue.message.deleted) {
						if (parseAndMatchMessage(await fetchMessage(previousValue.message), ID)) return previousValue; // Reload complete !
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

/**
 * @param {TextChannel} channel
 * @param {nulber} max maxiumum of Snowflake
 * @param {string} before
 */
export async function getEveryMessageSnowflake(channel, max = 1000, before = undefined) {
	/**
	 * @type {Collection<string,Message>}
	 */
	var messages = new Collection();
	while (messages.size < max) {
		const newMessages = await channel.messages.fetch({ limit: 50, before });
		if (!newMessages.size) break;
		messages = messages.concat(newMessages);
		before = newMessages.last().id; // le dernier est plus ancien
	}
	return messages;
}

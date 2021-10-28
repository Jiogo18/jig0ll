import { MessageEmbed as DiscordMessageEmbed, User, Constants } from 'discord.js';
import colorLib from '../lib/color.js';
const emptyChar = '||\n||'; //affiche un espace vide, est invisible et non selectionnable
const discordMaxLength = 2048;

/**
 * Make an interaction answer with the data and the type
 * @param {object} data
 * @param {number} type
 */
function makeForInteractionFromData(data, type) {
	return {
		data: {
			type: type || Constants.InteractionResponseTypes.CHANNEL_MESSAGE_WITH_SOURCE,
			data: data,
		},
	};
}
/**
 * Get custom color with his name
 * @param {string} color
 * @return {number} The color
 */
function getColor(color) {
	if (typeof color == 'number') return color;
	if (color?.match(colorLib.hexRegex)) {
		return colorLib.hexToDiscordColor(color);
	}
	switch (color) {
		case 'red':
			return 13369344;
		case 'blue':
			return 3447003;
		default:
			return 3447003;
	}
}

export const answerTypes = {
	// https://discord.com/developers/docs/interactions/slash-commands#interaction-response-interactionresponsetype
	ping: Constants.InteractionResponseTypes.PONG, // Pong
	dontAnswerHideInteraction: 2, // Acknowledge
	answerHideInteraction: 3, // AcknowledgeChannelMessage => ne pas répondre
	answerShowInteraction: Constants.InteractionResponseTypes.CHANNEL_MESSAGE_WITH_SOURCE, // ChannelMessageWithSource => répondre
	dontAnswerShowInteraction: Constants.InteractionResponseTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE, // AcknowledgeWithSource
};

export class MessageMaker {
	content;
	cosmetic;
	/**
	 * Get the content with cosmetics applied
	 * @param {{author: User, prefix: string, suffix: string}} cosmetic
	 */
	getContent(cosmetic = {}) {
		if (!cosmetic.author) cosmetic.author = this.cosmetic?.author;
		if (!cosmetic.prefix) cosmetic.prefix = this.cosmetic?.prefix;
		if (!cosmetic.suffix) cosmetic.suffix = this.cosmetic?.suffix;
		const author = cosmetic.author ? `${cosmetic.author.toString?.()} ` : '';
		const prefix = cosmetic.prefix || '';
		const suffix = cosmetic.suffix || '';
		var content = this.content;
		if (content.length > discordMaxLength) {
			desc = desc.substring(0, discordMaxLength - 15) + ' [...] ' + desc.slice(-10);
		}

		return author + prefix + content + suffix;
	}
	type;
	/**
	 * Override the type of the answer
	 * @param {number} type
	 */
	setType(type) {
		this.type = type;
		return this;
	}

	/**
	 * A pre-build message answer for messages and interactions
	 * @param {*} content The content of the answer
	 * @param {number} type The type of the answer
	 * @param {{author: User, prefix: string, suffix: string}} cosmetic
	 */
	constructor(content, type, cosmetic) {
		this.content = content;
		this.type = type;
		this.cosmetic = cosmetic;
	}

	/**
	 * Get the answer for interactions
	 * @param {number} type
	 * @param {{author: User, prefix: string, suffix: string}} cosmetic
	 */
	getForInteraction(type, cosmetic) {
		return makeForInteractionFromData({ content: this.getContent(cosmetic) }, this.type || type);
	}
	/**
	 * Get the answer for messages
	 * @param {number} type
	 * @param {{author: User, prefix: string, suffix: string}} cosmetic
	 */
	getForMessage(cosmetic) {
		return this.getContent(cosmetic);
	}
}

export class EmbedMaker extends MessageMaker {
	/**
	 * Get the content with cosmetics applied
	 * @param {{author: User, prefix: string, suffix: string}} cosmetic
	 */
	getContent(cosmetic = {}) {
		/**
		 * @type {DiscordMessageEmbed}
		 */
		this.content;
		if (!cosmetic.author) cosmetic.author = this.cosmetic?.author;
		if (!cosmetic.prefix) cosmetic.prefix = this.cosmetic?.prefix;
		if (!cosmetic.suffix) cosmetic.suffix = this.cosmetic?.suffix;
		if (cosmetic.author) this.content.setAuthor(cosmetic.author.username, cosmetic.author.avatarURL ? cosmetic.author.avatarURL() : undefined);
		const cosmeticLength = cosmetic?.prefix?.length + 1 || 0;
		if (this.content.description.length > discordMaxLength) {
			var desc = this.content.description;
			desc = desc.substring(0, discordMaxLength - 15 - cosmeticLength) + ' [...] ' + desc.slice(-10);
			this.content.setDescription(desc);
		}
		if (cosmetic.prefix) this.content.setDescription(prefix + '\n' + this.content.description);
		if (cosmetic.suffix) this.addField('', cosmetic.suffix, true);
		return this.content;
	}

	/**
	 * A pre-build Embed answer for messages and interactions
	 * @param {string} title Title of the embed
	 * @param {string | EmbedMaker} description Description of the embed
	 * @param {{prefix: string, suffix: string, color: string}} cosmetic Comestics for the embed
	 * @param {*} field Field(s) to add to the embed
	 * @param {number} type Type of the answer
	 */
	constructor(title, description, cosmetic, field, type) {
		if (description?.constructor == EmbedMaker) {
			/** @type {DiscordMessageEmbed} */
			var embed = description.content;
		} else {
			var embed = new DiscordMessageEmbed().setTitle(title).setDescription(description);
		}
		embed.setColor(getColor(cosmetic ? cosmetic.color : undefined));
		if (field) {
			embed.addFields(field);
		}
		super(embed, type, cosmetic);
	}

	static Error(title, message) {
		return new EmbedMaker(title, message, { color: 'red' });
	}

	/**
	 * Add a field to the embed
	 * @param {string} name Title of the field or `''` for no title
	 * @param {string} value Content of the field
	 * @param {boolean} inline Make an inline field
	 */
	addField(name, value, inline) {
		if (this.content.length > 2000) return this; //max: 2048
		this.content.addField(name || emptyChar, value, inline);
		return this;
	}
	/**
	 * Get the embed answer for interactions
	 * @param {number} type The default type of the answer if not set in constructor
	 * @param {{author: User, prefix: string, suffix: string}} cosmetic
	 */
	getForInteraction(type, cosmetic) {
		return makeForInteractionFromData({ embeds: [this.getContent(cosmetic)] }, this.type || type);
	}
	/**
	 * Get the message answer for messages
	 * @param {{author: User, prefix: string, suffix: string}} cosmetic
	 * @param {*} other
	 */
	getForMessage(cosmetic, other) {
		return { embeds: [this.getContent(cosmetic)], ...other };
	}
}

export class InteractionSpecialMaker extends MessageMaker {
	/**
	 * Make an interaction answer without content
	 * @param {number} type Type of the answer
	 */
	constructor(type) {
		super('', type);
	}
	/**
	 * Get the answer for interactions
	 * @param {number} type The type of the anwser
	 */
	getForInteraction(type) {
		return { data: { type: this.type || type } };
	}
	/**
	 * Their is no special answer for messages
	 */
	getForMessage() {}
}

export default {
	Message: MessageMaker,
	Embed: EmbedMaker,
	InteractionSpecial: InteractionSpecialMaker,
};

import { MessageEmbed as DiscordMessageEmbed, User } from 'discord.js';
const emptyChar = '||\n||';//affiche un espace vide, est invisible et non selectionnable
const discordMaxLength = 2048;

/**
 * Make an interaction answer with the data and the type
 * @param {object} data 
 * @param {number} type 
 */
function makeForInteractionFromData(data, type) {
	return { data: {
		type: type || 4,
		data: data
	}};
}
/**
 * Get custom color with his name
 * @param {string} color 
 * @return {number} The color
 */
function getColor(color) {
	switch(color) {
		case 'red': return 13369344;
		case 'blue': return 3447003;
		default: return 3447003;
	}
}


export const answerTypes = {
	// https://discord.com/developers/docs/interactions/slash-commands#interaction-response-interactionresponsetype
	ping: 1,// Pong
	dontAnswerHideInteraction: 2,// Acknowledge
	answerHideInteraction: 3,// AcknowledgeChannelMessage => ne pas répondre
	answerShowInteraction: 4,// ChannelMessageWithSource => répondre
	dontAnswerShowInteraction: 5,// AcknowledgeWithSource
}


export class MessageMaker {
	content;
	/**
	 * Get the content with cosmetics applied
	 * @param {{author: User, prefix: string, suffix: string}} cosmetic 
	 */
	getContent(cosmetic = {}) {
		const author = cosmetic.author ? (`<@!${cosmetic.author.id}> `) : '';
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
	setType(type) { this.type = type; return this; }

	/**
	 * A pre-build message answer for messages and interactions
	 * @param {*} content The content of the answer
	 * @param {number} type The type of the answer
	 */
	constructor(content, type) {
		this.content = content;
		this.type = type;
	}

	/**
	 * Get the answer for interactions
	 * @param {number} type 
	 * @param {{author: User, prefix: string, suffix: string}} cosmetic 
	 */
	getForInteraction(type, cosmetic) { return makeForInteractionFromData({ content: this.getContent(cosmetic) }, this.type || type); }
	/**
	 * Get the answer for messages
	 * @param {number} type 
	 * @param {{author: User, prefix: string, suffix: string}} cosmetic 
	 */
	getForMessage(cosmetic) { return this.getContent(cosmetic); }
}

export class EmbedMaker extends MessageMaker {
	/**
	 * Get the content with cosmetics applied
	 * @param {{author: User, prefix: string, suffix: string}} cosmetic
	 */
	getContent(cosmetic = {}) {
		if (cosmetic.author) this.content.setAuthor(cosmetic.author.username, cosmetic.author.avatarURL ? cosmetic.author.avatarURL() : undefined);
		const cosmeticLength = (cosmetic?.prefix?.length + 1) || 0;
		if (this.content.description.length > discordMaxLength) {
			var desc = this.content.description;
			desc = desc.substring(0, discordMaxLength - 15 - cosmeticLength) + ' [...] ' + desc.slice(-10);
			this.content.setDescription(desc);
			
		}
		if(cosmetic.prefix) this.content.setDescription(prefix + '\n' + this.content.description);
		if (cosmetic.suffix) this.addField('', cosmetic.suffix, true);
		return this.content;
	}
	
	/**
	 * A pre-build Embed answer for messages and interactions
	 * @param {string} title Title of the embed
	 * @param {string} description Description of the embed
	 * @param {{author: User, prefix: string, suffix: string, color: string}} cosmetic Comestics for the embed
	 * @param {*} field 
	 * @param {number} type Type of the answer
	 */
	constructor(title, description, cosmetic, field, type) {

		if (description.constructor == EmbedMaker) {
			/** @type {DiscordMessageEmbed} */
			var embed = description.content;
		}
		else {
			var embed = new DiscordMessageEmbed()
				.setTitle(title)
				.setDescription(description);
		}
		embed
			.setColor(getColor(cosmetic ? cosmetic.color : undefined))
		if(field) {
			embed.addFields(field);
		}
		super(embed, type);
	}
	
	/**
	 * Add a field to the embed
	 * @param {string} name Title of the field or `''` for no title
	 * @param {string} value Content of the field
	 * @param {boolean} inline Make an inline field
	 */
	addField(name, value, inline) {
		if (this.content.length > 2000) return this;//max: 2048
		this.content.addField(name || emptyChar, value, inline); return this;
	}
	/**
	 * Get the embed answer for interactions
	 * @param {number} type The default type of the answer if not set in constructor
	 * @param {{author: User, prefix: string, suffix: string}} cosmetic 
	 */
	getForInteraction(type, cosmetic) {
		return makeForInteractionFromData({ content: '', embeds: [ this.getContent(cosmetic) ] }, this.type || type);
	}
	/**
	 * Get the message answer for messages
	 * @param {{author: User, prefix: string, suffix: string}} cosmetic 
	 */
	getForMessage(cosmetic) { return this.getContent(cosmetic); }
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
	 * @param {number} type 
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
}
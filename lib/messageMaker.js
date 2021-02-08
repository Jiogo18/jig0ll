import { MessageEmbed as DiscordMessageEmbed } from 'discord.js';
const emptyChar = '||\n||';//affiche un espace vide, est invisible et non selectionnable

function makeForInteractionFromData(data, type) {
	return { data: {
		type: type || 4,
		data: data
	}};
}
function getColor(color) {
	switch(color) {
		case 'red': return 13369344;
		case 'blue': return 3447003;
		default: return 3447003;
	}
}

export class MessageMaker {
	content;
	getContent(cosmetic = {}) {
		const author = cosmetic.author ? (`<@!${cosmetic.author.id}> `) : '';
		const prefix = cosmetic.prefix || '';
		const suffix = cosmetic.suffix || '';
		return author + prefix + this.content + suffix;
	}
	type; setType(type) { this.type = type; return this; }
	//3: ne pas répondre
	//4: répondre
	//(type des interactions mais utile pour message aussi) https://discord.com/developers/docs/interactions/slash-commands#interaction-response-interactionresponsetype

	constructor(content, type) {
		this.content = content;
		this.type = type;
	}

	getForInteraction(type, cosmetic) { return makeForInteractionFromData({ content: this.getContent(cosmetic) }, this.type || type); }
	getForMessage(cosmetic) { return this.getContent(cosmetic); }
}
export class EmbedMaker extends MessageMaker {

	getContent(cosmetic = {}) {
		if(cosmetic.author) this.content.setAuthor(cosmetic.author.username, cosmetic.author.avatarURL ? cosmetic.author.avatarURL() : undefined);
		if(cosmetic.prefix) this.content.setDescription(prefix + '\n' + this.content.description);
		if(cosmetic.suffix) this.addField('', cosmetic.suffix, true);
		return this.content;
	}
	
	constructor(title, description, cosmetic, field, type) {

		var embed = new DiscordMessageEmbed()
			.setTitle(title)
			.setColor(getColor(cosmetic ? cosmetic.color : undefined))
			.setDescription(description);
		if(field) {
			embed.addFields(field);
		}
		super(embed, type);
	}
	
	addField(name, value, inline) { this.content.addField(name || emptyChar, value, inline); return this; }
	getForInteraction(type, cosmetic) {
		return makeForInteractionFromData({ content: '', embeds: [ this.getContent(cosmetic) ] }, this.type || type);
	}
	getForMessage(cosmetic) { return this.getContent(cosmetic); }
}

export class InteractionSpecialMaker extends MessageMaker {
	constructor(type) {
		super('', type);
	}
	getForInteraction(type) {
		return { data: { type: this.type || type } };
	}
}

export default {
	Message: MessageMaker,
	Embed: EmbedMaker,
	InteractionSpecial: InteractionSpecialMaker,
}
const Discord = require('discord.js');

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

class MessageMaker {
	content;
	getContent(cosmetic = {}) {
		const author = cosmetic.author ? (cosmetic.author + ' ') : '';
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
class EmbedMaker extends MessageMaker {

	getContent(cosmetic = {}) {
		if(cosmetic.author) this.content.setAuthor(cosmetic.author.username, cosmetic.author.avatarURL ? cosmetic.author.avatarURL() : undefined);
		if(cosmetic.prefix) this.content.setDescription(prefix + '\n' + this.content.description);
		if(cosmetic.suffix) this.addField('', cosmetic.suffix, true);
		return this.content;
	}
	
	constructor(title, description, cosmetic, field, type) {

		var embed = new Discord.MessageEmbed()
			.setTitle(title)
			.setColor(getColor(cosmetic ? cosmetic.color : undefined))
			.setDescription(description);
		if(field) {
			embed.addFields(field);
		}
		super(embed, type);
	}
	
	addField(name, value, inline) { this.content.addField(name, value, inline); return this; }
	getForInteraction(type, cosmetic) {
		return makeForInteractionFromData({ content: '', embeds: [ this.getContent(cosmetic) ] }, this.type || type);
	}
	getForMessage(cosmetic) { return this.getContent(cosmetic); }
}

module.exports = {
	Message: MessageMaker,
	Embed: EmbedMaker
}
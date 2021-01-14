const Discord = require('discord.js');

function makeForInteractionFromData(data, type) {
	return { data: {
		type: type || 4,
		data: data
	}};
}

class MessageMaker {
	content;
	type; setType(type) { this.type = type; return this; }

	constructor(content, type) {
		this.content = content;
		this.type = type;
	}

	getForInteraction(type) { return makeForInteractionFromData({ content: this.content }, this.type || type); }
	getForMessage() { return this.content; }
	
}
class EmbedMaker extends MessageMaker {
		
	constructor(title, description, cosmetic, field, type) {

		var embed = new Discord.MessageEmbed()
			.setTitle(title)
			.setColor((cosmetic ? cosmetic.color : undefined) || 3447003)
			.setDescription(description);
		if(field) {
			embed.addFields(field);
		}
		super(embed, type);
	}
	
	addField(name, value, inline) { this.content.addField(name, value, inline); return this; }
	getForInteraction(type) {
		return makeForInteractionFromData({ content: '', embeds: [ this.content ] }, this.type || type);
	}
}

module.exports = {
	Message: MessageMaker,
	Embed: EmbedMaker
}
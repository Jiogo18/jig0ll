const Discord = require('discord.js');
const MessageMaker = require('./messageMaker.js');
const inspect = Symbol.for('nodejs.util.inspect.custom');
const libCommand = require('../lib/command.js');


class CommandContent {
	#commandName; get commandName() { return this.#commandName; }
	#options; get options() { return this.#options; }
	#optionsName; get optionsName() { return this.#optionsName; }
	#optionsValue; get optionsValue() { return this.#optionsValue; }
	#commandLine; get commandLine() { return this.#commandLine; }

	constructor(commandName, options) {
		this.#commandName = commandName;
		this.#options = [];//format de #options: [ {'name':'a',value:'a'}, { 'name':'b', 'value':'123' } ]
		for(const option of (options || [])) {
			const newOption = {};
			if(typeof option == 'object') {
				newOption.name = option.name;
				if(option.value != undefined) newOption.value = option.value;
			}
			else {
				newOption.value = option;
			}
			this.#options.push(newOption);
		}
		//https://stackoverflow.com/questions/13973158/how-do-i-convert-a-javascript-object-array-to-a-string-array-of-the-object-attri#answer-13973194
		this.#optionsName = this.options.map(option => option.name);
		this.#optionsValue = this.options.map(option => option.value == undefined ? option.name : option.value);
		this.#commandLine = [this.commandName].concat(this.optionsValue).join(' ');//just for the console
	}

	clone() { return new CommandContent(this.#commandName, [...this.#options]); }

	static fromInteraction(interaction) {
		//format de interaction.data.options: [{ 'name':'a', options: [{'name':'b','value':'123'}] }], ou undefined si vide
		const options = [];
		var suboptions = interaction.data.options;
		while(suboptions && suboptions.length > 0) {
			const suboption = suboptions[0];
			if(suboption.value != undefined) {
				options.push( { name: suboption.name, value: suboption.value } );
			}
			else
				options.push( { name: suboption.name } );
			suboptions = suboption.options;
		}
		

		return new CommandContent(interaction.data.name, options);
	}
	static fromMessage(message) {
		var options = libCommand.splitCommand(message.content);//on suppose que le préfix est enlevé
		return new CommandContent(options.shift(), options);
	}
}


class CommandContext {
	#guild = { partiel: true };
		get guild() { return this.#guild || {partiel:true}; }
		get guild_id() { return typeof this.guild == 'object' ? this.guild.id : undefined  }
	#channel = { partiel: true };
		get channel() { return this.#channel || {partiel:true}; }
		get channel_id() { return typeof this.channel == 'object' ? this.channel.id : undefined  }
	#author = { partiel: true };
		get author() { return this.#author || {partiel:true}; };
		get username() { return this.author ? this.author.username : undefined; }
	
	constructor(guild, channel, author) {
		this.#guild = guild;
		this.#channel = channel;
		this.#author = author;
	}

	static fromInteraction(interaction, bot) {
		return new CommandContext(bot.guilds.cache.get(interaction.guild_id), bot.channels.cache.get(interaction.channel_id), interaction.member.user);
	}
	static fromMessage(message) {
		const channel = message.channel;
		return new CommandContext(channel ? channel.guild : undefined, channel, message.author);
	}
}




function makeSafeMessage(message) {
	if(message == undefined) { return undefined; }
	if(!message.getForMessage) {
		console.warn('CommandData::sendAnswer Message not created with MessageMaker'.yellow)
		if(message.type == 'rich')
			return new MessageMaker.Embed(message.title, message.description, message.cosmetic, message.fields);
		else
			return new MessageMaker.Message(message);
	}
	return message;
}

class CommandData {
	#content; get content() { return this.#content; }
	#context; get context() { return this.#context; }//readonly

	get commandName() { return this.content.commandName; }
	get options() { return this.content.options; }
	get optionsName() { return this.content.optionsName; }
	get optionsValue() { return this.content.optionsValue; }
	get commandLine() { return this.content.commandLine; }

	get guild_id() { return this.context.guild_id; }
	get guild() { return this.bot.guilds.cache.get(this.context.guild.id) || this.context.guild; }
	get channel() { return this.bot.channels.cache.get(this.context.channel.id) || this.context.channel; }
	get author() { return this.bot.users.cache.get(this.context.author.id) || this.context.author; }
	get source() {
		if(this.isInteraction) return 'interaction';
		if(this.isMessagePrivate) return 'message privé';
		if(this.isMessage) return 'message';
	}

	#commandSource; get commandSource() { return this.#commandSource; }
	#interactionMgr;
		get interactionMgr() { return this.#interactionMgr; }
		get bot() { return this.interactionMgr.bot; }
		get commands() { return this.interactionMgr.commandsMgr.commands; }


	constructor(content, context, commandSource, interactionMgr) {
		this.#content = content;
		this.#context = context;
		this.#commandSource = commandSource;
		this.#interactionMgr = interactionMgr;
	}

	[inspect]() {
		return `CommandData ${ { on: this.on, commandName: this.commandName, guild_id: this.guild_id } }`;
	}

	clone() { return new CommandData(this.content.clone(), this.context, this.interactionMgr); }


	async sendAnswer(target, message) {
		if(!message) { return false; }
		if(!target) {
			console.warn(`CommandData can't answer ${this.source}`);
			return false;
		}
		return await target(message);
	}
}


class CommandInteraction extends CommandData {
	constructor(interaction, interactionMgr) {
		super(CommandContent.fromInteraction(interaction), CommandContext.fromInteraction(interaction, interactionMgr.bot), interaction, interactionMgr);
	}

	get isInteraction() { return true };
	
	async sendAnswer(message) {
		message = makeSafeMessage(message);
		if(!message) { return false; }
		//https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Op%C3%A9rateurs/super#syntaxe
		var retour = undefined;
		try {
			retour = await super.sendAnswer(this.bot.api.interactions(this.commandSource.id, this.commandSource.token).callback.post, message.getForInteraction())
		}
		catch(e) {
			if(e.httpStatus == 404 && message.content != '') {
				const channel = this.bot.channels.cache.get(this.context.channel_id);
				retour = await channel.send(message.getForMessage({author: this.author}));
			}
		}
		return retour;
	}
}
class CommandMessage extends CommandData {
	#message_private = false;

	constructor(message, interactionMgr) {
		super(CommandContent.fromMessage(message), CommandContext.fromMessage(message), message, interactionMgr);
		this.#message_private = message.channel == undefined;
	}

	clone() { return new CommandMessage(this.commandSource, this.interactionMgr); }

	get isMessage() { return true };
	get isMessagePrivate() { return this.#message_private; }

	async sendAnswer(message) {
		message = makeSafeMessage(message);
		if(!message) { return false; }
		if(message.type == 3) {//don't reply
			return await this.commandSource.channel.send(message.getForMessage());
		}
		return await this.commandSource.reply(message.getForMessage());
	}
}



module.exports = {
	CommandContent: CommandContent,
	CommandContext: CommandContext,
	CommandData: CommandData,
	CommandInteraction: CommandInteraction,
	CommandMessage: CommandMessage,
}
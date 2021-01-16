const Discord = require('discord.js');
const MessageMaker = require('./messageMaker.js');
const inspect = Symbol.for('nodejs.util.inspect.custom');

function splitCommand(content) {
	//split mais de façon logique pour les ""
	//TODO : copie de commandes/commande.js donc il faut voir pour optimiser
	var msgSplit=[""];
	var onStr = false;
	for(let i=0; i<content.length; i++)
	{
		if(content[i] == "\\") {
			i++;
			continue;//on saute meme le prochain char
		}
		if(content[i] == "\"") {
			onStr = !onStr;
			if(onStr && msgSplit[msgSplit.length-1].length > 0)
				msgSplit[msgSplit.length] = "";//on ajoute une case
			continue;//on le save pas
		}
		if(!onStr && content[i] == " ")
		{//prochain arg
			msgSplit[msgSplit.length] = "";//on ajoute une case
			continue;//si on laisse plusieurs cases vides c'est pas grave (erreur de cmd)
		}
		msgSplit[msgSplit.length-1] = msgSplit[msgSplit.length-1] + content[i];//on ajoute le char
	}
	return msgSplit;
}

class CommandContent {
	#commandName; get commandName() { return this.#commandName; }
	#options; get options() { return this.#options; }
	#optionsName; get optionsName() { return this.#optionsName; }
	#optionsValue; get optionsValue() { return this.#optionsValue; }
	#commandLine; get commandLine() { return this.#commandLine; }

	constructor(commandName, options) {
		this.#commandName = commandName;
		this.#options = [];//format de interaction.data.options: [{ 'name':'a' },{ 'name':'b' }], ou undefined si vide
		for(const option of (options || [])) {
			if(typeof option == 'object')
				this.#options.push(option);
			else
				this.#options.push({ name: true, value: option });
		}
		//https://stackoverflow.com/questions/13973158/how-do-i-convert-a-javascript-object-array-to-a-string-array-of-the-object-attri#answer-13973194
		this.#optionsName = this.options.map(option => option.name);
		this.#optionsValue = this.options.map(option => option.value);
		this.#commandLine = [this.commandName].concat(this.optionsValue).join(' ');//just for the console
	}

	clone() { return new CommandContent(this.#commandName, [...this.#options]); }

	static fromInteraction(interaction) { return new CommandContent(interaction.data.name, interaction.data.options); }
	static fromMessage(message) {
		var options = splitCommand(message.content);//on suppose que le préfix est enlevé
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

	static fromInteraction(interaction) {
		return new CommandContext({ id: interaction.guild_id, partial: true }, { id: interaction.channel_id, partial: true }, interaction.member.user);
	}
	static fromMessage(message) {
		const channel = message.channel;
		return new CommandContext(channel && channel.guild, channel, message.author);
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

	getOptionValue(i) { console.warn('CommandData::getOptionValue deprecated'); return this.content.optionsValue[i]; }

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
		super(CommandContent.fromInteraction(interaction), CommandContext.fromInteraction(interaction), interaction, interactionMgr);
	}

	static isInteraction = true;
	
	async sendAnswer(message) {
		message = makeSafeMessage(message);
		if(!message) { return false; }
		//https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Op%C3%A9rateurs/super#syntaxe
		return await super.sendAnswer(this.bot.api.interactions(this.commandSource.id, this.commandSource.token).callback.post, message.getForInteraction())
			.catch(e => {
				if(e.httpStatus == 404) {
					const channel = this.bot.channels.cache.get(this.context.channel_id);
					channel.send(message.getForMessage({author: this.author}));
				}
			});
	}
}
class CommandMessage extends CommandData {
	#message_private = false;

	constructor(message, interactionMgr) {
		super(CommandContent.fromMessage(message), CommandContext.fromMessage(message), message, interactionMgr);
		this.#message_private = message.channel == undefined;
	}

	clone() { return new CommandMessage(this.commandSource, this.interactionMgr); }

	static isMessage = true;
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
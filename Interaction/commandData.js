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



function optionToOptionValue(option) {
	if(!option) return undefined;
	switch(typeof option) {
		case 'string': return option;//message
		case 'object': return option.value;//interaction
		default: console.warn(`Option unknow with type ${option}`.yellow);
	}
}
function optionToOptionName(option) {
		if(!option) return undefined;
		switch(typeof option) {
			case 'string': return true;//anything (it's a string)
			case 'object': return option.name;//interaction
			default: console.warn(`Option unknow with type ${option}`.yellow); return true;
		}
}


module.exports = class CommandData {
	static source = {
		MESSAGE: 'message', MESSAGE_PRIVATE: 'message_private', INTERACTION: 'interaction'
	};
	
	#on; get on() { return this.#on; }//#on can only be read (private)
		get isInteraction() { return this.on == CommandData.INTERACTION; }
		get isMessage() { return this.on == CommandData.MESSAGE || this.on == CommandData.MESSAGE_PRIVATE; }
	#commandObject; get commandSource() { return this.#commandObject; }
	#interaction;
		get interactionMgr() { return this.#interaction; }
		get bot() { return this.interactionMgr.bot; }
		get commands() { return this.interactionMgr.commandsMgr.commands; }



	commandName;
	#options;
		get options() { return this.#options || []; }
		set options(o) { this.#options = typeof o != 'object' ? undefined : o; }
		get optionsValue() {
			if(this.options.length == 0) return [];
			if(this.options[0].name == undefined) return this.options;
			return this.options.map(option => option.value);
		}
		get optionsName() {
			if(this.options.length == 0) return [];
			if(this.options[0].name == undefined) return this.options;
			return this.options.map(option => option.value);
		}
	#args; get args() { console.warn('deprecated'.yellow); return this.#args || this.options; }
	#commandLine; get commandLine() { return this.#commandLine; }

	#guild = { partiel: true };
		get guild() { return this.#guild || {partiel:true}; }
		get guild_id() { return typeof this.guild == 'object' ? this.guild.id : undefined  }
	#channel = { partiel: true };
		get channel() { return this.#channel || {partiel:true}; }
		get channel_id() { return typeof this.channel == 'object' ? this.channel.id : undefined  }
	#author = { partiel: true };
		get author() { return this.#author || {partiel:true}; };
		get username() { return this.author ? this.author.username : undefined; }

	constructor(source, commandObject, interactionMgr) {
		this.#on = source;
		this.#commandObject = commandObject;
		this.#interaction = interactionMgr;
		switch(source) {
			case CommandData.source.MESSAGE:
			case CommandData.source.MESSAGE_PRIVATE:
				this.options = splitCommand(commandObject.content);//on suppose que le préfix est enlevé
				this.commandName = this.options.shift();
				this.#commandLine = commandObject.content;
				if(commandObject.channel) {
				this.#guild = commandObject.channel.guild;
				this.#channel = commandObject.channel;
				}
				else {//message privé
					this.#on = CommandData.source.MESSAGE_PRIVATE
				}
				this.#author = commandObject.author;
				break;
			case CommandData.source.INTERACTION:
				this.commandName = commandObject.data.name;
				this.options = commandObject.data.options || [];
				//https://stackoverflow.com/questions/13973158/how-do-i-convert-a-javascript-object-array-to-a-string-array-of-the-object-attri#answer-13973194
				//format de interaction.data.options: [{ 'name':'a' },{ 'name':'b' }], ou undefined si vide
				this.#commandLine = `${[this.commandName].concat(this.optionsName).join(' ')}`;//just for the console
				this.#guild.id = commandObject.guild_id;
				this.#channel.id = commandObject.channel_id;
				this.#author = commandObject.member.user;
				break;
			default: console.warn(`CommandData source unknow: ${source}`);
		}
	}

	[inspect]() {
		return `CommandData ${ { on: this.on, commandName: this.commandName, guild_id: this.guild_id } }`;
	}

	clone() { return new CommandData(this.on, this.commandSource, this.interactionMgr); }

	getOptionValue(i) { return optionToOptionValue(this.options[i]); }
	getOptionType(i) { return optionToOptionName(this.options[i]); }



	async sendAnswer(message) {
		if(message == undefined) { return false; }
		if(!message.getForMessage) {
			if(message.type == 'rich')
				message = new MessageMaker.Embed(message.title, message.description, message.cosmetic, message.fields);
			else
				message = new MessageMaker.Message(message);
			console.warn('CommandData::sendAnswer Message not created with MessageMaker'.yellow)
		}

		switch(this.on) {
			case CommandData.source.MESSAGE:
				if(!this.channel.send) {
					return false;
				}
				return await this.channel.send(message.getForMessage());
			case CommandData.source.MESSAGE_PRIVATE:
				if(!this.author.send) {
					return false;
				}
				return await this.author.send(message.getForMessage());
			case CommandData.source.INTERACTION:
				return await this.bot.api.interactions(this.commandSource.id, this.commandSource.token)
					.callback.post(message.getForInteraction());
			default:
				console.warn(`CommandData can't answer ${context.on} ${context.isInteraction}`);
				return false;
		}
	}
}
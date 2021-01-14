const Discord = require('discord.js');

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



module.exports = class CommandData {
	static source = {
		MESSAGE: 'message', INTERACTION: 'interaction', MESSAGE_PRIVATE: 'message_private'
	};
	
	#on; get on() { return this.#on; }//#on can only be read (private)
		get isInteraction() { return this.on == CommandData.INTERACTION; }
		get isMessage() { return this.on == CommandData.MESSAGE || this.on == CommandData.MESSAGE_PRIVATE; }
	#commandObject; get commandSource() { return this.#commandObject; }
	#application;
		get application() { return this.#application; }
		get bot() { return this.application.bot; }
		get interactionMgr() { return this.application.interaction; }
		get commands() { return this.application.commands; }

	#commandName; get commandName() { return this.#commandName; }
	#options; get options() { return this.#options; }
	#args; get args() { return this.#args; }
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

	constructor(source, commandObject, application) {
		this.#on = source;
		this.#commandObject = commandObject;
		this.#application = application;
		switch(source) {
			case CommandData.source.MESSAGE:
			case CommandData.source.MESSAGE_PRIVATE:
				this.#options = splitCommand(commandObject.content);//on suppose que le préfix est enlevé
				this.#commandName = this.#options.shift();
				this.#args = this.#options;
				this.#commandLine = commandObject.prefix + commandObject.content;
				this.#guild = commandObject.channel.guild;
				this.#channel = commandObject.channel;
				this.#author = commandObject.author;
				break;
			case CommandData.source.INTERACTION:
				this.#commandName = commandObject.data.name;
				this.#options = commandObject.data.options || [];
				//https://stackoverflow.com/questions/13973158/how-do-i-convert-a-javascript-object-array-to-a-string-array-of-the-object-attri#answer-13973194
				//format de interaction.data.options: [{ 'name':'a' },{ 'name':'b' }], ou undefined si vide
				this.#args = this.options.map(option => option.name);
				this.#commandLine = `/${[this.commandName].concat(this.args).join(' ')}`;//just for the console
				this.#guild.id = commandObject.guild_id;
				this.#channel.id = commandObject.channel_id;
				this.#author = commandObject.member.user;
				break;
			default: console.warn(`CommandData source unknow: ${source}`);
		}
	}

	getOption(i) {
		if(!this.options || i < 0 || this.options.length <= i) return undefined;
		return this.options[i];
	}
	getOptionValue(i) {
		const option = this.getOption(i);
		if(!option) return undefined;
		switch(typeof option) {
			case 'string': return option;//message
			case 'object': return option.value;//interaction
			default: console.warn(`Option unknow with type ${option}`.yellow);
		}
	}
	getOptionType(i) {
		const option = this.getOption(i);
		if(!option) return undefined;
		switch(typeof option) {
			case 'string': return true;//anything (it's a string)
			case 'object': return option.name;//interaction
			default: console.warn(`Option unknow with type ${option}`.yellow); return true;
		}
	}


	getAnswer() {
		return 'work in progress';
	}
}
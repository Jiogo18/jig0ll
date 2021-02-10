import { MessageMaker, EmbedMaker } from '../../lib/messageMaker.js';
const inspect = Symbol.for('nodejs.util.inspect.custom');
import { splitCommand } from '../../lib/command.js';


export class CommandContent {
	#commandName; get commandName() { return this.#commandName; }
	#options; get options() { return this.#options; }
	#optionsName; get optionsName() { return this.#optionsName; }
	#optionsValue; get optionsValue() { return this.#optionsValue; }
	#commandLine; get commandLine() { return this.#commandLine; }

	constructor(commandName, options) {
		this.#commandName = commandName;
		this.#options = options.map(o => typeof o == 'object' ? o : { value: o });//format de #options: [ {'name':'a',value:'a'}, { 'name':'b', 'value':'123' } ]
		

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
			const suboption = suboptions.shift();
			if(suboption.value != undefined) {
				options.push( { name: suboption.name, value: suboption.value } );
				options[suboption.name] = suboption.value;
			}
			else
				options.push( { name: suboption.name } );
			
			if(suboptions.length == 0 && suboption.options)
				suboptions = suboption.options;
				//dans le cas contraire on est soit en fin de commande soit avec les Attributs (qui n'ont pas d'options !)
		}

		
		return new CommandContent(interaction.data.name, options);
	}
	static fromMessage(message) {
		const options = splitCommand(message.content) || [];//on suppose que le préfix est enlevé
		const firstOption = options.shift();
		const options2 = options.map(option => { return  {value: option} });
		return new CommandContent(firstOption, options2);
	}
}


export class CommandContext {
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
		console.warn('ReceivedCommand::sendAnswer Message not created with MessageMaker'.yellow)
		if(message.type == 'rich')
			return new EmbedMaker(message.title, message.description, message.cosmetic, message.fields);
		else
			return new MessageMaker(message);
	}
	return message;
}

export class ReceivedCommand {
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
	get id() { return this.commandSource.id; }
	#interactionMgr;
		get interactionMgr() { return this.#interactionMgr; }
		get bot() { return this.interactionMgr.bot; }
		get commands() { return this.interactionMgr.commandsMgr.commands; }

	receivedAt;
	

	constructor(content, context, commandSource, interactionMgr) {
		this.#content = content;
		this.#context = context;
		this.#commandSource = commandSource;
		this.#interactionMgr = interactionMgr;
		this.receivedAt = Date.now();
	}

	[inspect]() {
		return `ReceivedCommand ${ { on: this.on, commandName: this.commandName, guild_id: this.guild_id } }`;
	}

	clone() { return new ReceivedCommand(this.content.clone(), this.context, this.interactionMgr); }


	async sendAnswer(target, message) {
		if(!message) { return false; }
		if(!target) {
			console.warn(`ReceivedCommand can't answer ${this.source}`);
			return false;
		}
		return await target(message);
	}
}


export class ReceivedInteraction extends ReceivedCommand {
	answered = false;
	constructor(interaction, interactionMgr) {
		super(CommandContent.fromInteraction(interaction), CommandContext.fromInteraction(interaction, interactionMgr.bot), interaction, interactionMgr);
	}

	get isInteraction() { return true };
	
	async sendAnswer(message) {
		this.answered = true;
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
export class ReceivedMessage extends ReceivedCommand {
	#message_private = false;

	constructor(message, interactionMgr) {
		super(CommandContent.fromMessage(message), CommandContext.fromMessage(message), message, interactionMgr);
		this.#message_private = message.channel == undefined;
	}

	clone() { return new ReceivedMessage(this.commandSource, this.interactionMgr); }

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



export default {
	CommandContent,
	CommandContext,
	ReceivedCommand,
	ReceivedInteraction,
	ReceivedMessage,
}
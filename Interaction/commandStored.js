const Security = require('./security');
const MessageMaker = require('../lib/messageMaker');
const help = require('../commands/help');

function strToFlatStr(str) {
	return str.toLowerCase().replace(/[àâä]/g,'a').replace(/[éèêë]/g,'e').replace(/[ìîï]/g,'i').replace(/[òôö]/g,'o').replace(/[ùûü]/g,'u').replace('ÿ','y').replace('ñ','n');
}


class CommandBase {
	//https://discord.com/developers/docs/interactions/slash-commands#applicationcommand
	//contenu ; name, description, type, execute, la sécurité ()faire un objet pour ?), options (tableau de SubCommand)
	name;
	description;
		getHelpDescription(context) {
			return help.getFullDescriptionFor(context, this.name, this.parent.commandLine);
		}
	options;
	
	parent;
	#security;
		get security() { return this.#security; }
		set security(security) { this.#security = new Security.SecurityCommand(security, this.parent ? this.parent.security : undefined); }
	#execute;
	

	constructor(commandObject, parent) {
		this.parent = parent;
		this.name = commandObject.name;
		this.description = commandObject.description;
		this.security = commandObject.security || commandObject;//TODO: remove || commandObject (transition pour la securité)
		if(!this.security) {
			console.warn(`Command '${this.commandLine}' has no security`);
		}
		if(typeof commandObject.execute == 'function') { this.execute = commandObject.execute; }

		this.options = [];
		for(const subcommandObject of commandObject.options || []) {
			var subCommand = new SubCommand(subcommandObject, this);
			this.options.push(subCommand);
		}
	}


	isCommand(name) {
		return strToFlatStr(this.name) == strToFlatStr(name);
	}

	get commandLine() {
		if(this.parent && this.parent.commandLine) {
			return this.parent.commandLine + this.name;
		}
		return this.name;
	};

	get JSON() {
		return { 
			name: this.name,
			description: this.description,
			options: Object.entries(this.options).map(([optionName, option]) => {
				return option.JSON;
			}),
		};
	};

	execute(cmdData, options) {
		if(options && options.length) {//find the suboption
			const subCommand = this.getSubCommand(options);
			return subCommand.execute(cmdData);
		}

		//terminus => #execute
		if(!this.security || this.security.isAllowedToUse(cmdData.context) == false) { return new MessageMaker.Embed('', "Sorry you can't do that", { color: 'red' }); }

		if(typeof this.#execute == 'function') {
			return this.#execute(cmdData);
		}
		return new MessageMaker.Embed('', this.getHelpDescription(cmdData.context));
	}

	getSubCommand(options) {
		const subOptions = [...options];
		const subOption = subOptions.shift();
		if(!subOption) return;
		for(const subCommand of (this.options || [])) {
			if(subCommand.isCommand(subOption)) {
				if(subOptions.length) {//subcommand
					return subCommand.getSubCommand(subOptions);
				}
				return subCommand;
			}
		}
		throw `Option ${subOption.name || subOption.value} not found in ${this.commandLine}`;
	}
}



class SubCommand extends CommandBase {
	//https://discord.com/developers/docs/interactions/slash-commands#applicationcommandoption
	type;
	default;
	required;
	constructor(commandObject, parent) {
		super(commandObject, parent);
		this.type = commandObject.type;
		this.default = commandObject.default;
		this.required = commandObject.required;
	};

	isCommand(option) {
		if(option.name == undefined) {//avec un message on connait que value
			if(this.type <= 2) {//SUB_COMMAND & SUB_COMMAND_GROUP => value correspond au name
				return super.isCommand(option.value);
			}
			return true;
			//on accepte mais c'est pas sur que ce soit cette option...
			//TODO: switch pour vérifier le type
		}

		return super.isCommand(option.name);//avec les interactions
	};

	get JSON() {
		return { 
			...super.JSON,
			type: this.type,
			default: this.default,
			required: this.required,
		};
	};
}



module.exports = class CommandStored extends CommandBase {
	#interactionSlashCmd;
		get interaction() { return this.#interactionSlashCmd; };
		enableInteraction(enabled = true) { this.#interactionSlashCmd = enabled; return this; };
	
	constructor(commandObject) {
		super(commandObject);
		this.#interactionSlashCmd = commandObject.interaction;//enable interactions
		
		if(this.security.wip) {
			console.warn(`Command /${this.name} is WIP`.yellow)
		}
	}

	get allowedPlacesToCreateInteraction() {
		if(this.interaction != true) { return Security.SecurityPlace.NONE; }
		return this.security.place;
	}

	get JSON() {
		//the JSON Param used by the Discord API
		return { data: super.JSON }
	}
}

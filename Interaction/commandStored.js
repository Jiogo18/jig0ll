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
		get helpDescription(context) {
			return help.getFullDescriptionFor(context, this.name, this.parent.commandLine);
		}
	options;
	
	parent;
	#security;
		get security() { return this.#security; }
		set security(security) { this.#security = new Security(security, parent.securit); }
	#execute;
	

	constructor(commandObject, parent) {
		this.name = commandObject.name;
		this.description = commandObject.description;
		this.options = {};
		this.parent = parent;
		for(const subcommandObject of commandObject.options || []) {
			var subCommand = new SubCommand(subcommandObject, this);
			this.options[subCommand.flatName] = subCommand;
		}
		if(typeof commandObject.execute == 'function')
		this.execute = commandObject.execute;
		this.security = commandObject.security;
		if(!this.security) { console.warn(`Command '${this.commandLine}' has`); }
	}


	isCommand(name) { return strToFlatStr(this.name) == strToFlatStr(name); }

	get commandLine() {
		if(this.parent && this.parent.commandLine) {
			return this.parent.commandLine + this.name;
		}
		return this.name;
	};

	execute(options, cmdData) {
		if(options.length) {//find the suboption

			const subOptions = [...options];
			const subOption = subOptions.shift();

			for(const subCommand of this.options) {
				if(subCommand.isCommand(subOption)) {
					return subCommand.execute(subOptions, cmdData);
				}
			}
			console.warn(`Option ${subOption.name} ${subOption.value} not found in ${this.commandLine}`.yellow);
		}

		//terminus => #execute
		if(!this.security || this.security.isAllowedToUse(cmdData.context) == false) { return new MessageMaker.Embed('', "Sorry you can't do tath", { color: 'red' }); }

		if(typeof this.#execute == 'function') {
			return this.#execute(cmdData);
		}
		return new MessageMaker.Embed('', this.helpDescription(cmdData.context));
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
	}

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
	}
}



module.exports = {
	CommandStored: CommandBase

}
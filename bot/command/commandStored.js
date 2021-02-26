import Security from './security.js';
import { EmbedMaker, MessageMaker } from '../../lib/messageMaker.js';
import { CommandContext, ReceivedCommand } from './received.js';


const ApplicationCommandOptionType = {
	NONE: -1,
	INTERACTION: 0,
	SUB_COMMAND: 1,
	SUB_COMMAND_GROUP: 2,
	STRING: 3,
	INTEGER: 4,
	BOOLEAN: 5,
	USER: 6,
	CHANNEL: 7,
	ROLE: 8,
};

/**
 * Remove accents from characters
 * @param {string} str The string to 'flat'
 * @returns {string} The flat string
 */
function strToFlatStr(str) {
	if(typeof str != 'string') return '';
	return str.toLowerCase().replace(/[àâä]/g,'a').replace(/[éèêë]/g,'e').replace(/[ìîï]/g,'i').replace(/[òôö]/g,'o').replace(/[ùûü]/g,'u').replace('ÿ','y').replace('ñ','n');
}


class CommandBase {
	//https://discord.com/developers/docs/interactions/slash-commands#applicationcommandoption
	name;
	setName(name) { this.name = name; this.#flatName = strToFlatStr(name); }
	#flatName; get flatName() { return this.#flatName; }
	get type() { return ApplicationCommandOptionType.NONE; }
	isAllowedOptionType() { return false; }
	description;
	/**
	 * Get the full Help for this command
	 * @param {CommandContext} context The context where you need this help
	 * @returns {string} The description
	 */
	getHelpDescription(context) {
		if(!this.security.isAllowedToSee(context)) return;
		return new EmbedMaker(`Help ${this.commandLine}`, this.description);
	}
	/**
	 * Get the description of this command
	 * @param {CommandContext} context 
	 * @returns {string} The description in one (or two) line
	 */
	getHelpSmallDescription(context) {
		if(!this.security.isAllowedToSee(context) || this.security.hidden) return;
		return this.commandLine + (this.description ? ` : ${this.description}` : '');
	}

	default;
	required;
	
	parent;
	#security;
		get security() { return this.#security; }
		set security(security) { this.#security = new Security.SecurityCommand(security, this.parent ? this.parent.security : undefined); }

	/**
	 * @param {{name:string, description:string, type:number, default:boolean, required:boolean}} commandConfig The config of the command (like Discord format)
	 * @param {CommandBase} parent The parent of the command
	 */
	constructor(commandConfig, parent) {
		this.parent = parent;
		this.setName(commandConfig.name);
		this.description = commandConfig.description;
		this.default = commandConfig.default;
		this.required = commandConfig.required;

		this.security = commandConfig.security;
	}


	/**
	 * Test if this command is the command you are looking for
	 * @param {string} name The name of the command
	 */
	isCommand(name) {
		if(typeof name == 'object') name == name.name;
		return this.name == name || this.flatName == strToFlatStr(name);
	}

	get commandLine() {
		const parentLine = this.parent ? this.parent.commandLine : undefined;
		return (parentLine ? parentLine+' ':'') + this.name;
	};

	get JSON() {
		return {
			name: this.name,
			description: this.description || this.name,

			//pour CommandStored c'est pas utile mais ça l'est pour toutes les options
			type: this.type,
			default: this.default,
			required: this.required,
		};
	};
}


class CommandExtendable extends CommandBase {
	#execute;
	#executeAttribute;
	options = [];
	alts = [];
	/**
	 * Get the full Help for this command
	 * @param {CommandContext} context The context where you need this help
	 * @param {string} spaces The indentation of the description
	 * @returns {string} The description
	 */
	getHelpDescription(context, spaces = '\xa0 \xa0 ') {
		if (!this.security.isAllowedToSee(context)) return;
		
		const descriptionStr = [this.description, ...this.options.map(o => o.getHelpSmallDescription(context)).filter(o => o != undefined)];
		const retour = new EmbedMaker(`Help ${this.commandLine}`, descriptionStr.join('\n' + spaces));

		if (this.alts?.length) retour.addField('Alias', [this.name, ...this.alts].join(', '), true);
		return retour;
	}

	/**
	 * @param {{name:string, description:string, type:number, default:boolean, required:boolean, options:*[]}} commandConfig The config of the command (like Discord format)
	 * @param {CommandExtendable} parent The parent of the command (can only be a CommandExtendable)
	 */
	constructor(commandConfig, parent) {
		super(commandConfig, parent);
		this.#execute = commandConfig.execute;
		this.#executeAttribute = commandConfig.executeAttribute;

		for(const subCommandConfig of commandConfig.options || []) {
			const subType = subCommandConfig.type;
			if( !this.isAllowedOptionType(subType) ) {
				console.warn(`Option ${subCommandConfig.name} (type: ${subCommandConfig.type}) not allowed under '${this.commandLine}' (type: ${this.type}) :`);
				continue;
			}
			
			var subCommand;
			if(subType == ApplicationCommandOptionType.SUB_COMMAND) {
				subCommand = new CommandSub(subCommandConfig, this);
			}
			else if(subType == ApplicationCommandOptionType.SUB_COMMAND_GROUP) {
				subCommand = new CommandGroup(subCommandConfig, this);
			}
			else if(CommandAttribute.Types.includes(subType)) {
				subCommand = new CommandAttribute(subCommandConfig, this);
			}
			else {
				console.error(`Type unknow for option ${subCommandConfig.name} : ${subType}`.red);
				continue;
			}
			this.options.push(subCommand);
		}

		this.alts = commandConfig.alts || [];
	}

	get JSON() {
		return { 
			...super.JSON,
			options: Object.entries(this.options).map(([index, option]) => option.JSON),
		};
	}

	/**
	 * Test if this command is the command you are looking for
	 * @param {string|{name: string, value: string}} option The option
	 * @returns {boolean} `true` if this is the command, `false` if it's not
	 */
	isCommand(option) {
		if(typeof option == 'object') {
			return super.isCommand(option.name || option.value);
			//avec les interactions c'est name, avec les messages on connait que value
		}
		return super.isCommand(option);
	};

	/**
	 * Execute the command or the subcommand
	 * @param {ReceivedCommand} cmdData 
	 * @param {[{name:string, value:string}]} levelOptions Options
	 * @returns {MessageMaker} The answer of the command
	 */
	execute(cmdData, levelOptions) {
		if(levelOptions && levelOptions.length) {//find the suboption
			const [subCommand, subOptionsLevel] = this.getSubCommand(levelOptions);
			if(subCommand != this) return subCommand.execute(cmdData, subOptionsLevel);
		}
		
		//terminus => #execute
		if(!this.security || this.security.isAllowedToUse(cmdData.context) == false) { return new EmbedMaker('', "Sorry you can't do that", { color: 'red' }); }
		
		if(typeof levelOptions == 'object' && levelOptions.length) {
			if(typeof this.#executeAttribute == 'function') {
				return this.#executeAttribute(cmdData, levelOptions);//on est sur d'avoir des arguments
			}
		}
		
		if(typeof this.#execute == 'function') {
			return this.#execute(cmdData, levelOptions);
		}
		return this.getHelpDescription(cmdData.context);
	}

	/**
	 * Get the lowest command for levelOptions
	 * @param {[{name:string, value:string}]} levelOptions Options
	 * @returns {[CommandBase,[{name:string, value:string}]]} The command and remaning levelOptions
	 */
	getSubCommand(levelOptions) {
		//TODO: if(this.constructor == CommandSub) return this;//un SUB_COMMAND n'a que des CommandAttribute qui peuvent pas s'executer
		const subOptions = [...levelOptions];
		const subOption = subOptions.shift();
		if(!subOption) return [this, levelOptions];
		for(const subCommand of (this.options || [])) {
			if(subCommand.isCommand(subOption)) {
				if(CommandAttribute.Types.includes(subCommand.type)) {
					//seul les type = 0 et 1 qui doivent s'executer !
					return [this, levelOptions];
				}
				return subCommand.getSubCommand(subOptions);
			}
		}
		if(process.env.WIPOnly) {
			console.warn(`Option '${subOption.name || subOption.value}' not found in '/${this.commandLine}'`);
		}
		return [this, levelOptions];
	}
}



export default class CommandStored extends CommandExtendable {
	get type() { return ApplicationCommandOptionType.INTERACTION; }
	/**
	 * @param {number} type ApplicationCommandOptionType
	 */
	isAllowedOptionType(type) {
		return [ ApplicationCommandOptionType.SUB_COMMAND, ApplicationCommandOptionType.SUB_COMMAND_GROUP, ...CommandAttribute.Types ].includes(type);
	}
	#interactionInterface;
		get interaction() { return this.#interactionInterface; };
		enableInteraction(enabled = true) { this.#interactionInterface = enabled; return this; };
	
	#filename; get filename() { return this.#filename; }

	/**
	 * @param {{name:string, description:string, type:number, default:boolean, required:boolean, options:*[]}} commandConfig The config of the command (like Discord format)
	 * @param {string} filename The filename of the command
	 */
	constructor(commandConfig, filename) {
		super(commandConfig);
		this.#interactionInterface = commandConfig.interaction;//enable interactions
		
		if(!commandConfig.security) {
			console.warn(`Command '${this.commandLine}' has no security`.yellow);
		}
		if(this.security.wip) {
			console.warn(`Command /${this.name} is WIP`.yellow)
		}

		this.#filename = filename;
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

class CommandGroup extends CommandExtendable {
	get type() { return ApplicationCommandOptionType.SUB_COMMAND_GROUP; }
	/**
	 * @param {number} commandOptionType ApplicationCommandOptionType
	 */
	isAllowedOptionType(commandOptionType) { return commandOptionType == ApplicationCommandOptionType.SUB_COMMAND; }
}

class CommandSub extends CommandExtendable {
	get type() { return ApplicationCommandOptionType.SUB_COMMAND; }
	/**
	 * @param {number} commandOptionType ApplicationCommandOptionType
	 */
	isAllowedOptionType(commandOptionType) { return CommandAttribute.Types.includes(commandOptionType); }
}




class CommandAttribute extends CommandBase {
	#type;//type: 3-8
	get type() { return this.#type; }
	isAllowedOptionType() { return false; }//aucun autorisé en option
	static Types = [
		ApplicationCommandOptionType.STRING,
		ApplicationCommandOptionType.INTEGER,
		ApplicationCommandOptionType.BOOLEAN,
		ApplicationCommandOptionType.USER,
		ApplicationCommandOptionType.CHANNEL,
		ApplicationCommandOptionType.ROLE,
	];
	choices;//only for String and Integer

	/**
	 * @param {{name:string, description:string, type:number, default:boolean, required:boolean, choices:*[]}} commandConfig The config of the command (like Discord format)
	 * @param {CommandExtendable} parent The parent of this option
	 */
	constructor(commandConfig, parent) {
		super(commandConfig, parent);
		this.#type = commandConfig.type;
		if(commandConfig.options) console.warn(`CommandAttribute shouldn't have options (in '${this.commandLine}')`.yellow);

		this.choices = commandConfig.choices;
	}
	get commandLine() {
		const parentLine = this.parent ? this.parent.commandLine : undefined;
		return (parentLine ? parentLine+' ':'') + `[${this.name}]`;
	};

	get JSON() {
		return { 
			...super.JSON,
			choices: this.choices,
		};
	}

	/**
	 * Test if this command is the command you are looking for
	 * @deprecated CommandAttribute ne devrait pas pouvoir être executé
	 * @param {string|{name: string, value: string}} option The option
	 * @returns {boolean} `true` if this is the command, `false` if it's not
	 */
	isCommand(option) {
		//TODO: deprecated, CommandAttribute ne devrait pas pouvoir être executé
		//or keep it for to be sure for messages...?
		if(typeof option == 'object' && option.name != undefined) {
			return super.isCommand(option.name);//avec les interactions
		}
		const value = typeof option == 'object' ? option.value : option;
		//avec un message on connait que value
		if(super.isCommand(value)) return true;

		if(!option.possibleTypes) option.possibleTypes = possibleTypesOfValue(value);
		switch(this.type) {
			case ApplicationCommandOptionType.USER: return option.possibleTypes.includes('USER');
			case ApplicationCommandOptionType.CHANNEL: return option.possibleTypes.includes('USER');
			case ApplicationCommandOptionType.INTEGER: return option.possibleTypes.includes('number');
			case ApplicationCommandOptionType.BOOLEAN: return option.possibleTypes.includes('boolean');
			case ApplicationCommandOptionType.STRING: return option.possibleTypes.includes('string');
			default: return false;//normalement tout le monde passe par 'string' sauf si c'est un type différent !
		}
	};
}

/**
 * Get the possible/best types for value
 * @param {any} value The value to test
 * @returns {string[]} Possible Types
 */
function possibleTypesOfValue(value) {
	if(typeof value != 'string') return [ typeof value ];

	const types = ['string'];//string est forcément accepté

	if(value.match(/^<..?\d{10,20}>$/)) {
		//format: <.NOMBRE> ou <..NOMBRE> (. pour n'importe quoi), NOMBRE: snowflake avec min: 2015, max: 2154
		if(value.startsWith('<@')) types.push('USER');
		else if(value.startsWith('<#')) types.push('CHANNEL');
		else console.warn(`Target unknow : ${value}`.yellow);
		//rien pour ApplicationCommandOptionType.ROLE (pour l'instant)
	}
	const regexNumber = value.replace('.','').match(/\-?\d+/) || [''];
	if(typeof value == 'number' || regexNumber[0] == value.replace('.','')) {//nombres : -4.5
		//TODO future: séparer avec une catégorie double : https://github.com/discord/discord-api-docs/issues/2512
		types.push('number');
	}
	if(['true', 'false', 'vrai', 'faux', 'oui', 'non'].includes(value)) {
		types.push('boolean');
	}
	return types;
}
